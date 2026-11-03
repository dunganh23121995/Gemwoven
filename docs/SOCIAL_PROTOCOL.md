# Giao thức máy chủ xã hội Gemwoven · phiên bản 1

Dành cho client web hiện tại và client Godot sau này. Máy chủ: `server/social/server.js`. Luật dùng chung (giới hạn,
bản đồ, kiểm tra chữ, cấp bang): `src/gemwoven/social-protocol.js` — client Godot port đúng các hằng số và hàm kiểm tra này.

- Kết nối: WebSocket `wss://<miền game>/social` (dev: `ws://<máy dev>:8091/social`). Mỗi tin là một đối tượng JSON,
  trường `t` là loại tin. Tối đa 4 KB/tin, 30 tin/giây/kết nối, nhịp ping 30 giây.
- Tọa độ: điểm ảnh của bản đồ Quảng Trường 1024×1536 (`assets/gemwoven/plaza/plaza.json`: vùng đi được, vật cản, khu vực).
- Máy chủ quyết định mọi thứ; client gửi **ý định**.

## Client → máy chủ

| `t` | Trường | Ý nghĩa |
|---|---|---|
| `hello` | `id?`, `token?`, `p` (hồ sơ) | Đăng nhập lại bằng token; không có/sai → `needName` |
| `register` | `name`, `p` | Tạo tài khoản xã hội; trả `registered {id, token}` rồi `welcome` |
| `move` | `to: [x,y]` | Đích muốn tới; máy chủ đi từng bước 10 lần/giây, né vật cản |
| `profile` | `p` | Đổi tướng/diện mạo hiển thị |
| `channel` | `n` | Đổi kênh (tối đa 40 người) |
| `goto` | `id` | Đến cạnh một người bạn (đổi kênh nếu cần) |
| `say` | `ch: area|guild|whisper`, `text`, `to?` | Chat; tối đa 120 ký tự, 1 tin/2 giây (dồn 3) |
| `emote` | `id` | Một trong 8 biểu cảm |
| `friend` | `op: request|accept|decline|cancel|remove`, `id` | Lời mời cần đứng gần (≤ 170) hoặc cùng bang |
| `heart` | `id` | Tặng tim bạn bè mỗi ngày |
| `block` | `id`, `on` | Chặn / bỏ chặn |
| `report` | `id`, `reason` | Máy chủ đính kèm 20 tin gần nhất của người bị báo cáo |
| `duel` | `op: invite|accept|decline`, `id` | Mời giao hữu, trả lời trong 20 giây |
| `ring` | `ready` | Sẵn sàng trên Sàn Giao Hữu (phải đứng trong khu `ring`) |
| `guild` | `op` + trường | `list`, `info`, `create {name,tag,emblem}`, `apply {id}`, `approve/reject/kick/promote/demote {id}`, `leave`, `notice {text}`, `policy {policy,minLevel}`, `checkin`, `weave {color}` |
| `friends` | — | Xin lại danh sách bạn |
| `ping` | — | → `pong` |

Hồ sơ `p`: `{hero, look 1–3, level 1–500, stars 1–6, power, title, frame}` — **chưa xác thực** cho tới khi có máy chủ tài khoản.

## Máy chủ → client

| `t` | Trường |
|---|---|
| `needName` | — |
| `registered` | `id`, `token` (client lưu) |
| `welcome` | `you {id,name,created}`, `map`, `friends`, `guild` |
| `channel` | `n`, `players [{id,name,x,y,p,tag,guild}]`, `counts` |
| `join` / `player` | `p` (một người) |
| `leave` | `id` |
| `pos` | `seq`, `p: [[id,x,y], …]` — chỉ người vừa di chuyển, 10 lần/giây |
| `say` | `from`, `name`, `tag`, `ch`, `text`, `at`, (`to`, `toName` với tin riêng) |
| `emote` | `from`, `id` |
| `friends` | `friends [{id,name,online,channel,hero,level,heart}]`, `incoming`, `outgoing`, `blocks`, `friendPoints` |
| `friendReq` | `from`, `name` |
| `guild` | toàn bộ bảng bang của người xem hoặc `null` |
| `guilds` | `list` (tìm bang) |
| `duelInvite` | `from`, `name`, `p` |
| `duelStart` | `seed`, `opponent {id,name,hero,look}`, `label` |
| `toast` / `err` | `text` (`ref` với lỗi đăng ký) |

## Cúp Đấu Trường (thiết kế · máy chủ trận · Sắp ra mắt)

Chưa chạy: chỉ là hợp đồng cho máy chủ trận sau này (`docs/GAME_DESIGN.md` §12.5). Hằng số dùng chung: `progression.js` `CUP`
(lịch UTC+7, Elo K 40, kẹp ±240, 5 lượt/ngày dồn 10, 10/30 trận, Top 8), `liveops.js` `CUP_PRIZES`, `CUP_SCHEDULE`. Máy chủ tự
chạy trận (§12.4); client không gửi kết quả.

| `t` | Hướng | Trường | Ý nghĩa |
|---|---|---|---|
| `cup.status` | C → S | — | Xin trạng thái tháng: giai đoạn, lượt, điểm, hạng của mình |
| `cup.state` | S → C | `season`, `phase`, `round`, `phaseEnd`, `tickets`, `you {points,played,late,rank}` | Trả lời / đẩy khi đổi |
| `cup.table` | C → S / S → C | `from`, `n ≤ 100` / `rows [{rank,id,name,hero,points,played}]` | Top 100 + hàng của mình |
| `cup.queue` | C → S | `hero` (tướng đã phát hành, khóa trước khi ghép) | Vào hàng chờ, mất lượt khi trận bắt đầu |
| `cup.cancel` | C → S | — | Hủy chờ (sau 90 giây), không mất lượt |
| `cup.match` | S → C | `seed`, `opponent {id,name,hero}`, `round`, `game`, `label` | Bắt đầu trận (hero đối thủ lộ sau khi ghép) |
| `cup.result` | S → C | `won`, `draw`, `delta`, `points`, `series?` | Sau khi máy chủ chạy xong trận |
| `cup.bracket` | S → C | `seeds`, `rounds [{round,matches [{a,b,wins,replay}]}]` | Nhánh Top 8, xem lại |
| `cup.confirm` | C → S | — | Top 8 xác nhận tham dự trước 12:00 ngày tứ kết |
| `cup.history` | S → C | `months [{season,champion {id,name,hero}}]` | Vinh Danh 12 tháng |

## Tin mẫu (kiểm thử chéo client)

```json
{"t":"hello","p":{"hero":"fire","look":2,"level":45,"stars":4,"power":900}}
{"t":"needName"}
{"t":"register","name":"Lữ Khách An","p":{"hero":"fire","look":2,"level":45}}
{"t":"registered","id":"9f3c2a1b7d004e11","token":"…48 ký tự hex…"}
{"t":"move","to":[745,380]}
{"t":"pos","seq":312,"p":[["9f3c2a1b7d004e11",680,832]]}
{"t":"say","ch":"area","text":"Xin chào, đm"}
{"t":"say","from":"9f3c2a1b7d004e11","name":"Lữ Khách An","tag":"DN","ch":"area","text":"Xin chào, **","at":1793667590259}
{"t":"guild","op":"weave","color":"red"}
{"t":"err","text":"Đến chỗ Bà Dệt Đèn cạnh sảnh bang để dệt."}
```

Kiểm thử đầy đủ: `cd server/social && npm install && npm test`.
