const cron = require("node-cron");
const Post = require("../models/post.model");
const axios = require("axios");
// Define the cron job to run every minute
const now = new Date();

const scheduledPosts = cron.schedule("* * * * *", async () => {
  try {
    // Get all posts that are scheduled to be published
    const now = new Date();
    const posts = await Post.find({
      scheduledDate: { $lte: now },
      isPublished: false,
    });
    console.log(posts);
    // Publish each post on Facebook and update the isPublished field in MongoDB
    for (const post of posts) {
      try {
        const res = await axios.post(
          `https://graph.facebook.com/v16.0/${process.env.FB_PAGE_ID}/feed?access_token=${process.env.FB_ACCESS_TOKEN}`,
          {
            message: post.content,
          }
        );
        console.log(res);

        console.log(
          `Post ${post._id} published on Facebook with ID ${res.data.id}`
        );

        // Update the post's status in MongoDB
        try {
          await Post.findByIdAndUpdate(post._id, {
            isPublished: true,
            facebookId: res.data.id,
          });
          console.log(`Post ${post._id} updated in MongoDB`);
        } catch (err) {
          console.error(`Error updating post ${post._id} in MongoDB: ${err}`);
        }
      } catch (err) {
        console.error(`Error publishing post ${post._id} on Facebook: ${err}`);
      }
    }
  } catch (err) {
    console.error(`Error getting posts from MongoDB: ${err}`);
  }
});
module.exports = scheduledPosts;
