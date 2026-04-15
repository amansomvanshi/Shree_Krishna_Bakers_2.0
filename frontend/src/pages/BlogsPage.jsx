import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import LegalFooter from "../components/LegalFooter";
import api from "../utils/api";

const BlogsPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const { data } = await api.get("/user/blogs");
        setBlogs(data.blogs || []);
      } catch (error) {
        console.error("Failed to load blogs", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 5 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -5 }}
      transition={{ duration: 0.01, ease: "easeOut" }}
      className="bg-gray-50 min-h-screen pb-28"
    >
      <div className="w-full max-w-[600px] mx-auto bg-white min-h-screen shadow-x">
        <div className="p-5 border-b border-gray-100 sticky top-0 bg-white z-30">
          <h1 className="text-2xl font-black text-gray-900">Bakery Blogs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fresh updates, offers, behind-the-scenes videos aur specials.
          </p>
        </div>

        <div className="p-4 space-y-5">
          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading blogs...</div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <p className="font-bold text-gray-800">No blogs yet</p>
              <p className="text-sm text-gray-400 mt-1">Please check again soon.</p>
            </div>
          ) : (
            blogs.map((blog) => (
              <article key={blog._id} className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className="aspect-video bg-gray-100">
                  {blog.mediaType === "video" ? (
                    <video
                      src={blog.mediaUrl}
                      poster={blog.thumbnailUrl}
                      controls
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img src={blog.mediaUrl} alt={blog.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-black text-lg text-gray-900">{blog.title}</h2>
                  {blog.description && (
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">{blog.description}</p>
                  )}
                </div>
              </article>
            ))
          )}
        </div>

        <LegalFooter />
      </div>
    </motion.div>
  );
};

export default BlogsPage;
