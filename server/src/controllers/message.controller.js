const modelUser = require('../models/users.model');
const modelMessage = require('../models/message.model');
const { Op, Sequelize } = require('sequelize');

const { BadRequestError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');
const { getIO, connectedUsers } = require('../socket');

const socketService = require('../services/socketService');

function getConversationId(userA, userB) {
    return [userA.toString(), userB.toString()].sort().join('_');
}

class MessageController {
    // 📨 User gửi tin nhắn cho admin
    async createMessage(req, res) {
        const admin = await modelUser.findOne({ where: { role: 'admin' } });
        if (!admin) throw new BadRequestError('Không tìm thấy admin');

        const { id: senderId } = req.user;
        const { text } = req.body;

        const message = await modelMessage.create({
            senderId,
            receiverId: admin.id,
            conversationId: getConversationId(senderId, admin.id), // chỉ tính toán
            text,
        });

        const plainMessage = message.get({ plain: true });
        socketService.sendMessage(admin.id.toString(), 'newMessage', plainMessage);

        new Created({
            message: 'Gửi tin nhắn thành công',
            metadata: plainMessage,
        }).send(res);
    }

    // 📨 Admin gửi tin nhắn cho user
    async createMessageAdmin(req, res) {
        const { id } = req.user;
        const { receiverId, text } = req.body;

        const newMessage = await modelMessage.create({
            senderId: id,
            receiverId,
            text,
        });

        socketService.sendMessage(receiverId, 'newMessageUser', newMessage);

        new Created({
            message: 'Tạo tin nhắn thành công',
            metadata: newMessage,
        }).send(res);
    }

    // 📩 Lấy danh sách user nhắn tin đến admin (giống aggregate Mongo)
    async getAllUserMessage(req, res) {
        const { id } = req.user; // admin id

        // Lấy tin nhắn gần nhất + số tin chưa đọc của từng sender
        const latestMessages = await modelMessage.findAll({
            where: { receiverId: id },
            attributes: ['senderId', [Sequelize.fn('MAX', Sequelize.col('createdAt')), 'latestAt']],
            group: ['senderId'],
            raw: true,
        });

        const result = [];
        for (const msg of latestMessages) {
            const latestMessage = await modelMessage.findOne({
                where: {
                    senderId: msg.senderId,
                    receiverId: id,
                },
                order: [['createdAt', 'DESC']],
            });

            const unreadCount = await modelMessage.count({
                where: {
                    senderId: msg.senderId,
                    receiverId: id,
                    isRead: false,
                },
            });

            const senderInfo = await modelUser.findByPk(msg.senderId);

            result.push({
                senderId: senderInfo.id,
                email: senderInfo.email,
                fullName: senderInfo.fullName,
                unreadMessage: unreadCount,
                latestMessage: latestMessage?.text,
                latestAt: latestMessage?.createdAt,
                lastLoginAt: senderInfo.lastLoginAt,
                isOnline: senderInfo.isOnline,
            });
        }

        result.sort((a, b) => new Date(b.latestAt) - new Date(a.latestAt));

        new OK({ message: 'Lấy tin nhắn thành công', metadata: result }).send(res);
    }

    // 📄 Lấy tất cả tin nhắn giữa 2 user
    async getMessage(req, res) {
        const { senderId, receiverId } = req.query;
        const convId = getConversationId(senderId, receiverId);

        const data = await modelMessage.findAll({
            where: { conversationId: convId },
            order: [['createdAt', 'ASC']],
        });

        new OK({ message: 'Lấy tin nhắn thành công', metadata: data }).send(res);
    }

    // 📄 User lấy tin nhắn với admin
    async getMessageUser(req, res) {
        const { id } = req.user; // user hiện tại
        const { receiverId } = req.query; // người đối thoại

        const findAdmin = await modelUser.findOne({ where: { role: 'admin' } });

        const dataMessage = await modelMessage.findAll({
            where: {
                [Op.or]: [
                    { senderId: id, receiverId: receiverId || findAdmin.id }, // user gửi cho receiver
                    { senderId: receiverId || findAdmin.id, receiverId: id }, // receiver gửi cho user
                ],
            },
            order: [['createdAt', 'ASC']],
        });

        new OK({
            message: 'Lấy tin nhắn thành công',
            metadata: dataMessage,
        }).send(res);
    }

    // ✅ Đánh dấu đã đọc
    async readMessage(req, res) {
        const { id } = req.user;
        const { receiverId } = req.query;

        const dataMessageRead = await modelMessage.update(
            { isRead: '1' },
            { where: { senderId: receiverId, receiverId: id, isRead: '0' } },
        );

        new OK({ message: 'Đọc tin nhắn thành công', metadata: dataMessageRead }).send(res);
    }
}

module.exports = new MessageController();
