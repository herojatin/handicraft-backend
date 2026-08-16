import axios from "axios";

export const getInstagramPosts = async (req, res) => {
  try {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;

    const url =
      `https://graph.instagram.com/me/media` +
      `?fields=id,caption,media_url,media_type,thumbnail_url,permalink,timestamp` +
      `&access_token=${token}`;

    const response = await axios.get(url);

    let posts = response.data.data;

    posts = posts
      .filter(
        (post) =>
          post.media_type === "IMAGE" ||
          post.media_type === "CAROUSEL_ALBUM" ||
          post.media_type === "VIDEO"
      )
      .slice(0, 4);

    posts = posts.map((post) => ({
      id: post.id,
      caption: post.caption || "",
      permalink: post.permalink,
      image:
        post.media_type === "VIDEO"
          ? post.thumbnail_url
          : post.media_url,
      media_type: post.media_type,
      timestamp: post.timestamp,
    }));

    res.json(posts);
  } catch (err) {
    console.log(err.response?.data || err.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch Instagram posts",
    });
  }
};