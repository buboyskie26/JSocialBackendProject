//
const userModel = require("../models/usersModel");
const conversationsModel = require("../models/conversationsModel");
const messagesModel = require("../models/messagesModel");

// Goal:
// Can Chat individual and Group Chat.
// CRUD operation for this. No Validation yet.

// Check if it has a conversation before.
//
exports.addMessageIndividual = async (req, res) => {
  //
  try {
    //
    const { otherUserId } = req.body;
    const loggedInUserId = req.user.userId;

    //
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getUserMessages = async (req, res) => {
  //
  try {
    //
    // const { otherUserId } = req.body;
    const loggedInUserId = req.user.userId;

    const chatList = await messagesModel.getUserChatList(loggedInUserId);

    if (!chatList) return res.status(200).json({ data: "null" });

    res.status(200).json({ data: chatList });
    //
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const loggedInUserId = req.user.userId;
    console.log({ messageId });
    // 🧩 Ensure message exists and belongs to the user
    const deletedMessage = await messagesModel.deleteMessage(
      messageId,
      loggedInUserId
    );

    if (!deletedMessage) {
      return res.status(404).json({
        message: "Message not found or you don’t have permission to delete it.",
      });
    }

    return res.status(200).json({
      message: "Message deleted successfully.",
      data: deletedMessage,
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Server error." });
  }
};
exports.updateConversation = async (req, res) => {
  //
  try {
    // const { messageId } = req.params;

    const { messageContent, messageId } = req.body;

    console.log({ messageId });
    const loggedInUserId = req.user.userId;
    console.log({ loggedInUserId });
    // Check if convo exists with the user message and he owned the message.
    //
    const checkOwnConvo = await messagesModel.checkMessageConversation(
      messageId,
      loggedInUserId
    );
    console.log({ checkOwnConvo });
    if (!checkOwnConvo) {
      return res
        .status(403)
        .json({ message: "You are not allowed to edit this message." });
    }

    // ✅ 2. Proceed with update
    const updatedMessage = await messagesModel.updateMessage(
      messageId,
      messageContent
    );

    if (!updatedMessage) {
      return res.status(404).json({ message: "Message not found." });
    }

    // ✅ 3. Success response
    res.status(200).json({
      message: "Message updated successfully.",
      data: updatedMessage,
    });
    if (checkOwnConvo !== null) {
      // Update Message.
    }
    //
    //
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
  //
};
exports.addConversation = async (req, res) => {
  try {
    //
    const { chatUserId, messageContent, replyToMessageId } = req.body;
    //
    const loggedInUserId = req.user.userId;

    // Check if Login User Has already Convo Id with the Chat User Id.
    // If no, then continue below.
    const hasConversation =
      await conversationsModel.checkExistingConversationIndividual(
        loggedInUserId,
        chatUserId
      );
    console.log({ hasConversation });
    // return res.status(200).json({ data: hasConversation });

    // if (hasConversation?.length === 0) {
    if (!hasConversation) {
      //
      const insertConversation = await conversationsModel.InsertConversation(
        "individual",
        null,
        loggedInUserId
      );
      console.log({ insertConversation });
      if (insertConversation?.id) {
        //
        // Add conversation members.
        const convoId = insertConversation?.id;

        const addConvoUserId =
          await conversationsModel.InsertConversationMembers(
            convoId,
            loggedInUserId,
            "member"
          );

        const addConvoChatUserId =
          await conversationsModel.InsertConversationMembers(
            convoId,
            chatUserId,
            "member"
          );

        // if (insertConversationMember?.length > 0) {
        // Add Message.
        //
        console.log({ convoId });
        
        const addMessage = await messagesModel.InsertMessageIndividual(
          convoId,
          loggedInUserId,
          messageContent,
          replyToMessageId
        );

        if (addMessage?.id) {
          return res.status(201).json({ data: addMessage });
        }
        //
        // }
      }
    } else {
      // Get
      const getConversationId = hasConversation.id;

      // Todo, Bug if the user has no conversation at all and tried to message other user
      console.log({ getConversationId });
      console.log({ loggedInUserId });
      console.log({ messageContent });
      console.log({ replyToMessageId });
      //
      // Add a message.
      const addMessage = await messagesModel.InsertMessageIndividual(
        getConversationId,
        loggedInUserId,
        messageContent,
        replyToMessageId || null
      );

      if (addMessage?.id) {
        return res.status(201).json({ data: addMessage });
      }
    }
    // res.json({ user: result.rows[0] });
    //
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};
exports.searchUserMessagesv2 = async (req, res) => {
  //
  try {
    //
    const loggedInUserId = req.user.userId;

    const { conversationId } = req.body;
    const { messageText } = req.query;

    const userMessages = await messagesModel.searchMessages(
      messageText,
      loggedInUserId,
      conversationId
    );

    if (!userMessages) return res.status(200).json({ data: [] });

    res.status(200).json({ data: userMessages });
    //
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};
//
exports.searchUserMessages = async (req, res) => {
  try {
    const loggedInUserId = req.user.userId;
    const { conversationId, messageText } = req.query; // Both from query

    if (!messageText || !conversationId) {
      return res.status(400).json({
        error: "messageText and conversationId are required",
      });
    }

    const userMessages = await messagesModel.searchMessages(
      messageText,
      loggedInUserId,
      conversationId
    );

    res.status(200).json({ data: userMessages });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

//
exports.sendMessageToUser = async (req, res) => {
  try {
    //
    const senderId = req.user.userId;
    const { receiverId, content, messageType, replyToMessageId } = req.body;

    // Validation
    if (!receiverId || !content) {
      return res.status(400).json({
        error: "receiverId and content are required",
      });
    }

    if (senderId === receiverId) {
      return res.status(400).json({
        error: "Cannot send message to yourself",
      });
    }

    // Check if receiver exists
    const receiverExists = await userModel.checkUserExists(receiverId);
    if (!receiverExists) {
      return res.status(404).json({
        error: "Receiver not found",
      });
    }

    const result = await messagesModel.sendMessageNoConvoQuery(
      senderId,
      receiverId,
      content,
      messageType,
      replyToMessageId
    );

    // You can emit socket event here for real-time updates
    // io.to(receiverId).emit('new_message', result.message);

    return res.status(201).json({
      success: true,
      data: result.message,
      conversationId: result.conversationId,
      isNewConversation: result.isNewConversation,
    });
    //
  } catch (error) {
    console.error("Error in sendMessage controller:", error);
    res.status(500).json({ error: "Server error" });
  }
};
//
