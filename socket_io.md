```socket.io

- emit  : phát ra 1 sự kiện

- on : lắng nghe 1 sự kiện

- io là Socket Server (toàn cục)

- socket là kết nối cụ thể của một client

-Các phương thức trong socket.io :

  + io.on("connection", callback) : Lắng nghe khi có client kết nối  ------- io.on("connection", (socket) => {...})

  + socket.on(event, callback) : Lắng nghe sự kiện từ client   ------ socket.on("sendMessage", (data) => {...})

  + socket.emit(event, data) : Gửi sự kiện chỉ cho client hiện tại  -------- socket.emit("welcome", "Chào mừng!")

  + io.emit(event, data) : Gửi cho tất cả client đang kết nối -------- io.emit("newMessage", msg)

  + socket.broadcast.emit(event, data) : Gửi cho tất cả trừ chính client này  --------- socket.broadcast.emit("userJoined", socket.id)

  + socket.id : ID duy nhất của mỗi client

  + socket.join(roomName) : Thêm client vào một “room”  ------ socket.join("adminRoom")

  + socket.leave(roomName) : Rời khỏi room   -------- socket.leave("adminRoom")

  + io.to(room).emit(event, data) : Gửi sự kiện tới tất cả client trong room --------------- io.to("adminRoom").emit("newOrder", order)

  + socket.to(room).emit(event, data) : Gửi cho các client trong room đó, trừ chính mình ----------------- socket.to("chatRoom").emit("userTyping", user)

  + socket.disconnect() : Ngắt kết nối socket

```
