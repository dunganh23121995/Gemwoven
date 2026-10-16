/* Opponent search. Inject inside the game's closure via GAME_EXTENSIONS.
   Search uses numeric copies only: it never calls swapData/makePlan/rand/refill.
   Unknown refill cells stay empty, so lookahead sees only surviving known tiles. */
function enemyThinkingLevel(stage = state.stage) {
  stage = Math.max(1, Number(stage) || 1);
  if (stage < 5) return { label: 'Làm quen', depth: 1, choices: stage < 3 ? 4 : 3, beam: 0, maxNodes: 160 };
  if (stage < 10) return { label: 'Chiến thuật', depth: 1, choices: 1, beam: 0, maxNodes: 160 };
  if (stage < 20) return { label: 'Đọc nước đi', depth: 2, choices: 1, beam: 4, maxNodes: 400 };
  return { label: 'Bậc thầy', depth: 3, choices: 1, beam: 4, responseBeam: 2, maxNodes: 320 };
}

const OpponentAI = (() => {
  const N = 8, LEN = 64, EMPTY = 0, BOLT = 1, BOMB = 2, CORE = 3;
  const encode = tile => tile ? ((tile.type >= 0 ? tile.type + 1 : 0) | ({ bolt: BOLT, bomb: BOMB, core: CORE }[tile.special] || 0) << 3) : EMPTY;
  const type = value => (value & 7) - 1;
  const kind = value => value >> 3;
  const sum = counts => counts.reduce((a, b) => a + b, 0);
  const now = () => typeof performance !== 'undefined' ? performance.now() : Date.now();
  const rank = (a, b) => b.score - a.score || a.from - b.from || a.to - b.to || (a.coreType ?? -1) - (b.coreType ?? -1);
  let variationSeed = (Date.now() >>> 0) ^ 0x9e3779b9;
  function variation() {
    variationSeed ^= variationSeed << 13; variationSeed ^= variationSeed >>> 17; variationSeed ^= variationSeed << 5;
    return (variationSeed >>> 0) / 4294967296;
  }

  function snapshot(source = board, current = state) {
    return {
      cells: source.flat().map(encode),
      state: {
        stage: current.stage || 1, key: current.key || 'fire', enemyKey: current.enemyKey || 'earth',
        hp: current.hp, heroMax: current.heroMax || HEROES[current.key].hp, armor: current.armor || 0,
        energy: current.energy || 0, enemyHp: current.enemyHp, enemyMax: current.enemyMax,
        enemyArmor: current.enemyArmor || 0, enemyEnergy: current.enemyEnergy || 0,
        boss: !!current.boss, enraged: !!current.enraged, frozen: !!current.frozen,
        stunned: !!current.stunned, playerFrozen: !!current.playerFrozen,
        noriStunTurns: current.noriStunTurns || 0, noriStoredDamage: current.noriStoredDamage || 0,
      },
    };
  }

  function matches(cells) {
    const groups = [], marked = new Uint8Array(LEN);
    for (let axis = 0; axis < 2; axis++) for (let line = 0; line < N; line++) {
      for (let start = 0; start < N;) {
        const at = p => axis ? p * N + line : line * N + p;
        const t = type(cells[at(start)]);
        let end = start + 1;
        if (t >= 0 && kind(cells[at(start)]) !== CORE) {
          while (end < N && type(cells[at(end)]) === t && kind(cells[at(end)]) !== CORE) end++;
          if (end - start >= 3) {
            const group = [];
            for (let p = start; p < end; p++) { group.push(at(p)); marked[at(p)] = 1; }
            groups.push(group);
          }
        }
        start = end;
      }
    }
    return { groups, marked, count: marked.reduce((a, b) => a + b, 0) };
  }

  function clusters(groups) {
    const result = [];
    for (const group of groups) {
      const combined = new Set(group);
      for (let j = result.length - 1; j >= 0; j--) {
        if (result[j].some(p => combined.has(p))) {
          result[j].forEach(p => combined.add(p)); result.splice(j, 1);
        }
      }
      result.push([...combined]);
    }
    return result;
  }

  // A secondary core's real colour is random. Score the most costly possible
  // gift conservatively rather than consuming the live RNG or claiming foresight.
  function dangerousCoreType(cells, current) {
    const counts = [0, 0, 0, 0, 0];
    for (const cell of cells) if (type(cell) >= 0) counts[type(cell)]++;
    const weights = [current.key === 'fire' ? 15 : 10, current.hp < current.heroMax * .7 ? 8 : 1,
      current.energy >= 65 ? 9 : 4, 9, current.armor < 30 ? 6 : 2];
    let best = 0;
    for (let i = 1; i < 5; i++) if (counts[i] * weights[i] > counts[best] * weights[best]) best = i;
    return best;
  }

  function plan(cells, match, side, preferred, primaryCore, coreType, current) {
    const targets = new Uint8Array(match.marked), gifts = new Uint8Array(LEN), queued = new Uint8Array(LEN);
    const creates = [], actions = [];
    if (side === 'hero') for (const cluster of clusters(match.groups)) {
      const special = cluster.length >= 6 ? CORE : cluster.length === 5 ? BOMB : cluster.length === 4 ? BOLT : 0;
      const normal = cluster.filter(p => !kind(cells[p]));
      if (special && normal.length) {
        const p = normal.includes(preferred) ? preferred : normal[Math.floor(normal.length / 2)];
        creates.push({ at: p, special }); targets[p] = 0;
      }
    }
    const enqueue = p => { if (kind(cells[p]) && !queued[p]) { queued[p] = 1; actions.push(p); } };
    if (primaryCore != null) { targets[primaryCore] = 1; enqueue(primaryCore); }
    for (let p = 0; p < LEN; p++) if (targets[p]) enqueue(p);
    let uncertainCores = 0;
    for (let a = 0; a < actions.length; a++) {
      const origin = actions[a], special = kind(cells[origin]);
      let hitType = type(cells[origin]);
      if (special === CORE) {
        hitType = origin === primaryCore ? coreType : dangerousCoreType(cells, current);
        if (origin !== primaryCore) uncertainCores++;
      }
      for (let p = 0; p < LEN; p++) {
        if (!cells[p]) continue;
        const hit = special === BOLT ? Math.abs((p / N | 0) - (origin / N | 0)) <= 2 && Math.abs(p % N - origin % N) <= 2
          : special === CORE ? p === origin || type(cells[p]) === hitType
            : type(cells[p]) === hitType && kind(cells[p]) !== CORE;
        if (hit) { targets[p] = 1; gifts[p] = 1; enqueue(p); }
      }
    }
    creates.forEach(item => targets[item.at] = 0);
    return { targets, gifts, creates, actions, uncertainCores };
  }

  function gravity(cells) {
    const next = new Array(LEN).fill(EMPTY);
    for (let col = 0; col < N; col++) {
      let row = N - 1;
      for (let r = N - 1; r >= 0; r--) if (cells[r * N + col]) next[row-- * N + col] = cells[r * N + col];
    }
    return next;
  }

  function damageValue(current, side, raw) {
    const enemy = side === 'enemy', attacker = enemy ? current.enemyKey : current.key, defender = enemy ? current.key : current.enemyKey;
    if (!enemy && current.key === 'earth') raw *= .6;
    const beats = { fire: 'ice', ice: 'earth', earth: 'lightning', lightning: 'fire' };
    let value = Math.round(raw * (beats[attacker] === defender ? 1.5 : 1) * (enemy && current.enraged ? 1.25 : 1));
    if (enemy && current.key === 'ice') value = Math.round(value * .8);
    if (!enemy && current.key === 'earth' && current.noriStunTurns > 0) {
      current.noriStoredDamage += value;
      return value * 3 * .8; // Discount the pending burst until the seal expires.
    }
    const hp = enemy ? 'hp' : 'enemyHp', armor = enemy ? 'armor' : 'enemyArmor';
    const blocked = Math.min(current[armor], value), dealt = Math.min(current[hp], value - blocked);
    current[armor] -= blocked; current[hp] -= dealt;
    return dealt + blocked * .72;
  }

  function loot(current, counts, side) {
    if (!sum(counts)) return { value: 0, damage: 0, heal: 0, armor: 0, energy: 0 };
    const enemy = side === 'enemy', key = enemy ? current.enemyKey : current.key;
    const hp = enemy ? 'enemyHp' : 'hp', armor = enemy ? 'enemyArmor' : 'armor', energy = enemy ? 'enemyEnergy' : 'energy';
    const maximum = enemy ? current.enemyMax : current.heroMax;
    const hpRatio = current[hp] / Math.max(1, maximum);
    const gain = enemy ? sum(counts) * 3 + (counts[2] ? 25 : 0)
      : (counts[0] * 7 + counts[2] * 5 + (counts[1] + counts[3] + counts[4]) * 2) * (key === 'lightning' ? 2 : 1);
    const beforeEnergy = current[energy];
    const energyGain = Math.min(100 - beforeEnergy, gain); current[energy] += energyGain;
    const damage = damageValue(current, side, counts[0] * 8 * (enemy ? current.boss ? 1.15 : .55 : key === 'fire' ? 1.6 : 1));
    const healing = Math.min(Math.max(0, maximum - current[hp]), counts[1] * 6); current[hp] += healing;
    const armorGain = Math.min(999 - current[armor], counts[4] * (enemy ? 5 : key === 'ice' ? 8 : 4));
    const armorWeight = current[armor] < 20 ? .85 : current[armor] < 60 ? .5 : .2;
    current[armor] += armorGain;
    let value = damage + healing * (hpRatio < .3 ? 1.75 : hpRatio < .65 ? 1.15 : .7) + armorGain * armorWeight;
    value += energyGain * (enemy ? current.boss ? .35 : .16 : .32);
    if (beforeEnergy < 100 && current[energy] >= 100) value += enemy ? current.boss ? 42 : 14 : 45;
    if (counts[3]) {
      if (enemy) { const drain = Math.min(current.energy, 20); current.energy -= drain; value += drain * .5; }
      else if (counts[3] >= 3) { if (!current.frozen) value += 24 + current.stage * .5; current.frozen = true; }
    }
    return { value, damage, heal: healing, armor: armorGain, energy: energyGain };
  }

  function positionPotential(cells, current) {
    let result = 0;
    for (let p = 0; p < LEN; p++) {
      const t = type(cells[p]); if (t < 0) continue;
      const weight = t === 0 ? 1.5 : t === 1 ? (current.hp < current.heroMax * .5 ? 1.3 : .3) : t === 3 ? 1.2 : .8;
      if (p % N < 7 && type(cells[p + 1]) === t) result += weight;
      if (p < 56 && type(cells[p + N]) === t) result += weight;
    }
    return result;
  }

  function analyze(cells, current, from, to, side = 'enemy', explicitCoreType = null) {
    if (!cells[from] || !cells[to] || Math.abs((from / N | 0) - (to / N | 0)) + Math.abs(from % N - to % N) !== 1) return null;
    let next = cells.slice(); [next[from], next[to]] = [next[to], next[from]];
    const fusionWaves=kind(cells[from])===CORE&&kind(cells[to])===CORE?cells.filter(cell=>kind(cell)).length:0;
    const primary = kind(cells[from]) === CORE ? to : kind(cells[to]) === CORE ? from : null;
    const other = primary === to ? from : to;
    const coreType = primary == null ? null : type(next[other]) >= 0 ? type(next[other]) : explicitCoreType ?? dangerousCoreType(next, current);
    let match = matches(next);
    if (primary == null && !match.count) return null;
    if (primary != null) match = { groups: [], marked: new Uint8Array(LEN), count: 0 };
    const heroCounts = [0, 0, 0, 0, 0], enemyCounts = [0, 0, 0, 0, 0];
    let cascades = 0, specials = 0, createdValue = 0, uncertainCores = 0;
    while ((match.count || cascades === 0 && primary != null) && cascades < 8) {
      const action = fusionWaves?{
        targets:Uint8Array.from(next,cell=>cell?1:0),gifts:new Uint8Array(LEN).fill(1),
        creates:[],actions:next.flatMap((cell,p)=>kind(cell)?[p]:[]),uncertainCores:0,
      }:plan(next, match, side, cascades === 0 ? to : null, cascades === 0 ? primary : null, coreType, current);
      specials += action.actions.length; uncertainCores += action.uncertainCores;
      for (let p = 0; p < LEN; p++) if (action.targets[p]) {
        const t = type(next[p]);
        if (t >= 0) (side === 'hero' || action.gifts[p] ? heroCounts : enemyCounts)[t]++;
        next[p] = EMPTY;
      }
      for (const item of action.creates) {
        next[item.at] = (item.special === CORE ? 0 : next[item.at] & 7) | item.special << 3;
        createdValue += item.special === CORE ? 36 : item.special === BOMB ? 24 : 16;
      }
      next = gravity(next); match = matches(next); cascades++;
    }
    const after = { ...current };
    // The live resolver applies player-owned special rewards before enemy loot.
    const hero = loot(after, heroCounts, 'hero');
    // Future refill colours are unknown: value their uniform expectation, but
    // keep the search board empty and never consume gameplay randomness.
    if(fusionWaves)for(let wave=1;wave<fusionWaves&&after.hp>0&&after.enemyHp>0;wave++){
      const expected=loot(after,new Array(5).fill(LEN/5),'hero');
      for(const key of Object.keys(hero))hero[key]+=expected[key];
    }
    const enemy = after.enemyHp > 0 ? loot(after, enemyCounts, 'enemy') : { value: 0, damage: 0, heal: 0, armor: 0, energy: 0 };
    let score = enemy.value - hero.value - createdValue;
    if (after.enemyHp <= 0) score = -100000;
    else if (after.hp <= 0) score = 100000;
    else score -= positionPotential(next, after) * .08;
    const mainType = enemyCounts.indexOf(Math.max(...enemyCounts));
    const reason = after.hp <= 0 ? 'Kết liễu' : sum(heroCounts) ? 'Cân nhắc ngọc đặc biệt của bạn'
      : enemy.heal > 0 && current.enemyHp < current.enemyMax * .5 ? 'Hồi phục khi nguy hiểm'
        : current.enemyEnergy < 100 && after.enemyEnergy >= 100 ? 'Tích đủ nộ ra chiêu'
          : mainType === 4 ? 'Gia cố phòng thủ' : mainType === 3 ? 'Hút năng lượng' : mainType === 2 ? 'Tích năng lượng' : 'Tạo sát thương';
    return { from, to, coreType, score, immediateScore: score, reason, next, after,
      heroCounts, enemyCounts, hero, enemy, specials, cascades, createdValue, uncertainCores, fusionWaves };
  }

  function legal(cells, current, side = 'enemy', budget = null) {
    const moves = [];
    const compare = side === 'hero' ? (a, b) => a.score - b.score || a.from - b.from || a.to - b.to : rank;
    for (let from = 0; from < LEN; from++) for (const to of [from % N < 7 ? from + 1 : -1, from < 56 ? from + N : -1]) {
      if (to < 0 || !cells[from] || !cells[to]) continue;
      if (budget && budget.nodes >= budget.maxNodes) { budget.exhausted = true; return moves.sort(compare); }
      const best = analyze(cells, current, from, to, side);
      if (best) { moves.push(best); if (budget) budget.nodes++; }
    }
    return moves.sort(compare);
  }

  async function choose(data, options = {}) {
    const start = now(), level = enemyThinkingLevel(data.state.stage);
    const budget = { nodes: 0, maxNodes: options.maxNodes || level.maxNodes, exhausted: false };
    const roots = legal(data.cells, data.state, 'enemy', budget);
    if (!roots.length) return null;
    let yields = 0, sliceStart = now();
    const yieldIfNeeded = async () => {
      if (now() - sliceStart >= (options.sliceMs || 6)) {
        await new Promise(resolve => setTimeout(resolve, 0)); yields++; sliceStart = now();
      }
    };
    // Evaluate only the strongest fixed beam. Fixed node limits make high-stage
    // results deterministic; elapsed time controls cooperative yields, not choice.
    const evaluated = [];
    if (level.depth > 1) for (const root of roots.slice(0, level.beam)) {
      if (Math.abs(root.score) >= 100000 || budget.exhausted) continue;
      const responses = root.after.playerFrozen ? [] : legal(root.next, root.after, 'hero', budget);
      let continuation = 0;
      if (responses.length) {
        const candidates = responses.slice(0, level.depth > 2 ? level.responseBeam : 1);
        continuation = Infinity;
        for (const response of candidates) {
          let value = response.immediateScore;
          if (level.depth > 2 && !response.after.frozen && !response.after.stunned && Math.abs(value) < 100000 && !budget.exhausted) {
            const followups = legal(response.next, response.after, 'enemy', budget);
            if (followups.length) value += followups[0].immediateScore * .55;
          }
          continuation = Math.min(continuation, value);
          await yieldIfNeeded();
        }
      } else if (level.depth > 2 && root.after.playerFrozen && !root.after.frozen && !budget.exhausted) {
        const followups = legal(root.next, { ...root.after, playerFrozen: false }, 'enemy', budget);
        if (followups.length) continuation = followups[0].immediateScore * .55;
      }
      root.score = root.immediateScore + continuation * .78;
      root.reason = level.depth > 2 ? 'Đọc phản đòn và chuẩn bị nước tiếp' : 'Tránh nước phản đòn mạnh';
      root.responseScore = continuation;
      evaluated.push(root);
      await yieldIfNeeded();
    }
    // Unsearched moves must not outrank a searched move simply because their
    // opponent reply was omitted. Choose from the same evaluated root beam.
    let candidates = (level.depth > 1 && evaluated.length ? [...evaluated, ...roots.filter(move => Math.abs(move.immediateScore) >= 100000)] : roots).sort(rank);
    if (level.choices > 1 && candidates[0].score < 100000) {
      const safe = candidates.filter(move => move.score > -50000);
      candidates = (safe.length ? safe : candidates).slice(0, level.choices);
      const random = options.random || variation;
      const index = Math.min(candidates.length - 1, Math.max(0, Math.floor(random() * candidates.length)));
      candidates = [candidates[index]];
    }
    const best = candidates[0];
    return { ...best, level, stats: { nodes: budget.nodes, depth: level.depth, yields, elapsedMs: now() - start,
      budgetExhausted: budget.exhausted, knownTilesOnly: true } };
  }

  return { snapshot, matches, plan, analyze, legal, choose, encode, type, kind };
})();

async function chooseEnemyMove(options = {}) {
  const liveTiles = board.flat();
  const chosen = await OpponentAI.choose(OpponentAI.snapshot(board, state), options);
  if (!chosen) return null;
  return { a: liveTiles[chosen.from], b: liveTiles[chosen.to], score: chosen.score,
    reason: chosen.reason, level: chosen.level, coreType: chosen.coreType, stats: chosen.stats };
}
