const recentSearches = require("../models/recentSearchesModel");

exports.getUserRecentSearches = async (req, res) => {
  //
  try {
    //
    const userId = req.user.userId;

    const getAllRecentSearches = await recentSearches.getRecentSearches(userId);
    return res.status(200).json({ data: getAllRecentSearches });
    //
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error." });
  }
};


// Upon clicking of user searched.
//
exports.addUpdateRecentSearches = async (req, res) => {
  //
  try {
    //
    const loggedInUserId = req.user.userId;

    const { searchedUserId } = req.body;

    const getAllRecentSearches = await recentSearches.addRecentSearch(
      loggedInUserId,
      searchedUserId
    );
    return res.status(200).json({ data: getAllRecentSearches });
    //
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error." });
  }
};
exports.deletedRecentSearchesv2 = async (req, res) => {
  //
  try {
    //
    const loggedInUserId = req.user.userId;
    const { searchedUserId } = req.body;

    const deletedSearch = await recentSearches.deleteRecentSearch(
      loggedInUserId,
      searchedUserId
    );
    return res.status(200).json({ data: deletedSearch });
    //
  } catch (error) {
    console.error("Controller error:", error.message);
    return res.status(400).json({ error: error.message });
  }
};

exports.deletedRecentSearches = async (req, res) => {
  try {
    const loggedInUserId = req.user.userId;
    const { searchedUserId } = req.body;

    // Call service
    const deletedSearch = await recentSearches.deleteRecentSearch(
      loggedInUserId,
      searchedUserId
    );

    // If deletion returns null (shouldn’t happen often, but safe check)
    if (!deletedSearch) {
      return res
        .status(404)
        .json({ error: "Recent search not found or already deleted." });
    }
    // Success response
    return res.status(200).json({
      message: "Recent search deleted successfully.",
      data: deletedSearch,
    });
  } catch (error) {
    console.error("Controller error:", error.message);

    // Return the specific error message from the service
    return res.status(400).json({ error: error.message });
  }
};
