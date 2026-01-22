//
const conversationsModel = require("../models/conversationsModel");
const messagesModel = require("../models/messagesModel");

// Goal:
// Action: Getting the messages from the SELECTED Conversation.

exports.getConversationMessageById = async (req, res) => {
  try {
    //
    const { conversationId } = req.params;

    const loggedInUserId = req.user.userId;

    const convoMessages = await messagesModel.getConversationMessagesWithUser(
      conversationId,
      // loggedInUserId
    );
    //
    if (convoMessages) {
      return res.status(200).json({
        data: convoMessages,
      });
    } else {
      return res.status(200).json({
        data: "No conversation messages found with this user.",
      });
    }
    //
  } catch (error) {
    console.error("Error getting conversation messages:", error);
    res.status(500).json({ message: "Server error." });
  }
};

exports.getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const loggedInUserId = req.user.userId;

    // Parse query parameters
    const limit = parseInt(req.query.limit) || 15;
    const before = req.query.before; // message_id (for loading older messages)
    const after = req.query.after; // message_id (for loading newer messages)

    // Validate limit (prevent abuse)
    if (limit > 100) {
      return res.status(400).json({
        message: "Limit cannot exceed 100 messages",
      });
    }

    let result;

    if (before) {
      // Load messages BEFORE a specific message (scrolling UP)
      result = await messagesModel.getMessagesBefore(
        conversationId,
        before,
        limit,
      );
    } else if (after) {
      // Load messages AFTER a specific message (scrolling DOWN in search)
      result = await messagesModel.getMessagesAfter(
        conversationId,
        after,
        limit,
      );
    } else {
      // Initial behavior as the user click the conversation
      // Load most recent messages (initial load messages)
      result = await messagesModel.getRecentMessages(conversationId, limit);
    }

    return res.status(200).json({
      data: result.messages,
      pagination: {
        hasMore: result.hasMore,
        count: result.messages.length,
        limit: limit,
      },
    });
  } catch (error) {
    console.error("Error getting conversation messages:", error);
    res.status(500).json({ message: "Server error." });
  }
};

//

/**
 * Search messages and get messages around a specific message
 * GET /api/conversations/:conversationId/messages/:messageId/around?before=15&after=15
 */
exports.getMessagesAroundTarget = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const beforeCount = parseInt(req.query.before) || 15;
    const afterCount = parseInt(req.query.after) || 15;

    const result = await messagesModel.getMessagesAround(
      conversationId,
      messageId,
      beforeCount,
      afterCount,
    );

    if (!result.targetMessage) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    return res.status(200).json({
      data: result.messages,
      targetMessage: result.targetMessage,
      pagination: {
        hasMoreBefore: result.hasMoreBefore,
        hasMoreAfter: result.hasMoreAfter,
        count: result.messages.length,
      },
    });
  } catch (error) {
    console.error("Error getting messages around target:", error);
    res.status(500).json({ message: "Server error." });
  }
};

//
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const loggedInUserId = req.user.userId;
    console.log({ messageId });
    // 🧩 Ensure message exists and belongs to the user
    const deletedMessage = await messagesModel.deleteMessage(
      messageId,
      loggedInUserId,
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
      loggedInUserId,
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
      messageContent,
    );

    //

    const receivedId = "";
    if (!updatedMessage) {
      return res.status(404).json({ message: "Message not found." });
    }


    // ✅ 3. Success response
    res.status(200).json({
      message: "Message updated successfully.",
      data: updatedMessage,
    });
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
        chatUserId,
      );
    console.log({ hasConversation });
    // return res.status(200).json({ data: hasConversation });

    // if (hasConversation?.length === 0) {
    if (!hasConversation) {
      //
      const insertConversation = await conversationsModel.InsertConversation(
        "individual",
        null,
        loggedInUserId,
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
            "member",
          );

        const addConvoChatUserId =
          await conversationsModel.InsertConversationMembers(
            convoId,
            chatUserId,
            "member",
          );

        // if (insertConversationMember?.length > 0) {
        // Add Message.
        //
        console.log({ convoId });
        const addMessage = await messagesModel.InsertMessageIndividual(
          convoId,
          loggedInUserId,
          messageContent,
          replyToMessageId,
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
        replyToMessageId || null,
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

//
//

exports.checkRecentSearchHasConvo = async (req, res) => {
  try {
    const loggedInUserId = req.user.userId;
    const { otherUserId } = req.params;

    // Validate otherUserId
    if (!otherUserId || otherUserId === loggedInUserId) {
      return res.status(400).json({
        error: "Invalid user ID",
      });
    }

    const conversation = await conversationsModel.checkRecentSearchHasConvo(
      otherUserId,
      loggedInUserId,
    );

    return res.status(200).json({
      hasConversation: !!conversation,
      data: conversation,
    });
    //
  } catch (error) {
    console.error("Error in checkRecentSearchHasConvo:", error);
    res.status(500).json({ error: "Server error." });
  }
};
