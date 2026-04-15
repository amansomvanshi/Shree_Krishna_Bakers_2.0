import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../utils/api";

const MAX_BLOG_FILE_SIZE = 5 * 1024 * 1024;

const emptyBlog = {
  title: "",
  description: "",
  mediaUrl: "",
  thumbnailUrl: "",
  mediaType: "video",
  isActive: true,
  sortOrder: 0,
};

const emptyBlogFiles = {
  mediaFile: null,
  thumbnailFile: null,
};

const emptyOffer = {
  title: "",
  code: "",
  applyType: "manual",
  discountType: "fixed",
  discountValue: 50,
  minOrderAmount: 199,
  isActive: true,
  sortOrder: 0,
};

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-gray-500">
      {label}
    </span>
    {children}
  </label>
);

const ContentOffers = () => {
  const [activeTab, setActiveTab] = useState("blogs");
  const [blogs, setBlogs] = useState([]);
  const [offers, setOffers] = useState([]);
  const [blogForm, setBlogForm] = useState(emptyBlog);
  const [offerForm, setOfferForm] = useState(emptyOffer);
  const [editingBlogId, setEditingBlogId] = useState(null);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [blogFiles, setBlogFiles] = useState(emptyBlogFiles);
  const [blogErrors, setBlogErrors] = useState({
    mediaFile: "",
    thumbnailFile: "",
    mediaUrl: "",
    thumbnailUrl: "",
  });

  const fetchBlogs = async () => {
    const { data } = await api.get("/admin/blogs");
    setBlogs(data.blogs || []);
  };

  const fetchOffers = async () => {
    const { data } = await api.get("/admin/offers");
    setOffers(data.offers || []);
  };

  useEffect(() => {
    fetchBlogs();
    fetchOffers();
  }, []);

  const saveBlog = async (event) => {
    event.preventDefault();
    if (!blogForm.mediaUrl.trim() && !blogFiles.mediaFile) {
      setBlogErrors((current) => ({
        ...current,
        mediaFile: "Please provide either a media link or a media file.",
        mediaUrl: "Please provide either a media link or a media file.",
      }));
      return;
    }

    if (blogForm.mediaUrl.trim() && blogFiles.mediaFile) {
      setBlogErrors((current) => ({
        ...current,
        mediaFile: "Use either a media link or a media file.",
        mediaUrl: "Use either a media link or a media file.",
      }));
      return;
    }

    if (blogForm.thumbnailUrl.trim() && blogFiles.thumbnailFile) {
      setBlogErrors((current) => ({
        ...current,
        thumbnailFile: "Use either a thumbnail link or a thumbnail image file.",
        thumbnailUrl: "Use either a thumbnail link or a thumbnail image file.",
      }));
      return;
    }

    const formData = new FormData();
    formData.append("title", blogForm.title.trim());
    formData.append("description", blogForm.description.trim());
    formData.append("mediaUrl", blogForm.mediaUrl.trim());
    formData.append("thumbnailUrl", blogForm.thumbnailUrl.trim());
    formData.append("mediaType", blogForm.mediaType);
    formData.append("isActive", String(blogForm.isActive));
    formData.append("sortOrder", String(Number(blogForm.sortOrder || 0)));

    if (blogFiles.mediaFile) {
      formData.append("mediaFile", blogFiles.mediaFile);
    }
    if (blogFiles.thumbnailFile) {
      formData.append("thumbnailFile", blogFiles.thumbnailFile);
    }

    try {
      if (editingBlogId) {
        await api.put(`/admin/blogs/${editingBlogId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/admin/blogs", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setBlogForm(emptyBlog);
      setBlogFiles(emptyBlogFiles);
      setBlogErrors({ mediaFile: "", thumbnailFile: "", mediaUrl: "", thumbnailUrl: "" });
      setEditingBlogId(null);
      fetchBlogs();
      toast.success(editingBlogId ? "Blog updated" : "Blog uploaded");
    } catch (error) {
      toast.error(error.response?.data?.error || "Blog save failed");
    }
  };

  const saveOffer = async (event) => {
    event.preventDefault();
    const payload = {
      ...offerForm,
      code: offerForm.applyType === "manual" ? offerForm.code.toUpperCase() : "",
      discountValue: Number(offerForm.discountValue || 0),
      minOrderAmount: Number(offerForm.minOrderAmount || 0),
      sortOrder: Number(offerForm.sortOrder || 0),
    };

    if (editingOfferId) {
      await api.put(`/admin/offers/${editingOfferId}`, payload);
    } else {
      await api.post("/admin/offers", payload);
    }

    setOfferForm(emptyOffer);
    setEditingOfferId(null);
    fetchOffers();
  };

  const editBlog = (blog) => {
    setBlogForm({
      title: blog.title || "",
      description: blog.description || "",
      mediaUrl: blog.mediaUrl || "",
      thumbnailUrl: blog.thumbnailUrl || "",
      mediaType: blog.mediaType || "video",
      isActive: Boolean(blog.isActive),
      sortOrder: blog.sortOrder || 0,
    });
    setBlogFiles(emptyBlogFiles);
    setBlogErrors({ mediaFile: "", thumbnailFile: "", mediaUrl: "", thumbnailUrl: "" });
    setEditingBlogId(blog._id);
  };

  const editOffer = (offer) => {
    setOfferForm(offer);
    setEditingOfferId(offer._id);
  };

  const validateSelectedFile = (file, fieldName) => {
    if (!file) {
      setBlogErrors((current) => ({ ...current, [fieldName]: "" }));
      return true;
    }

    if (file.size > MAX_BLOG_FILE_SIZE) {
      setBlogErrors((current) => ({
        ...current,
        [fieldName]: "Files larger than 5 MB are not allowed.",
      }));
      return false;
    }

    if (fieldName === "thumbnailFile" && !file.type.startsWith("image/")) {
      setBlogErrors((current) => ({
        ...current,
        [fieldName]: "Only image files are allowed for the thumbnail.",
      }));
      return false;
    }

    if (fieldName === "mediaFile") {
      if (blogForm.mediaType === "video" && !file.type.startsWith("video/")) {
        setBlogErrors((current) => ({
          ...current,
          [fieldName]: "Only video files are allowed when media type is Video.",
        }));
        return false;
      }

      if (blogForm.mediaType === "image" && !file.type.startsWith("image/")) {
        setBlogErrors((current) => ({
          ...current,
          [fieldName]: "Only image files are allowed when media type is Image.",
        }));
        return false;
      }

      if (!["image/", "video/"].some((type) => file.type.startsWith(type))) {
        setBlogErrors((current) => ({
          ...current,
          [fieldName]: "Please choose a valid image or video file.",
        }));
        return false;
      }
    }

    setBlogErrors((current) => ({ ...current, [fieldName]: "" }));
    return true;
  };

  const handleBlogFileChange = (fieldName, file) => {
    if (!validateSelectedFile(file, fieldName)) {
      setBlogFiles((current) => ({
        ...current,
        [fieldName]: null,
      }));
      return;
    }

    setBlogFiles((current) => ({
      ...current,
      [fieldName]: file || null,
    }));

    if (fieldName === "mediaFile" && file) {
      setBlogForm((current) => ({ ...current, mediaUrl: "" }));
      setBlogErrors((current) => ({ ...current, mediaUrl: "" }));
    }

    if (fieldName === "thumbnailFile" && file) {
      setBlogForm((current) => ({ ...current, thumbnailUrl: "" }));
      setBlogErrors((current) => ({ ...current, thumbnailUrl: "" }));
    }
  };

  const handleBlogTextChange = (fieldName, value) => {
    setBlogForm((current) => ({ ...current, [fieldName]: value }));
    setBlogErrors((current) => ({ ...current, [fieldName]: "" }));

    if (fieldName === "mediaUrl" && value.trim()) {
      setBlogFiles((current) => ({ ...current, mediaFile: null }));
      setBlogErrors((current) => ({ ...current, mediaFile: "" }));
    }

    if (fieldName === "thumbnailUrl" && value.trim()) {
      setBlogFiles((current) => ({ ...current, thumbnailFile: null }));
      setBlogErrors((current) => ({ ...current, thumbnailFile: "" }));
    }
  };

  const isMediaUrlDisabled = Boolean(blogFiles.mediaFile);
  const isMediaFileDisabled = Boolean(blogForm.mediaUrl.trim());
  const isThumbnailUrlDisabled = Boolean(blogFiles.thumbnailFile);
  const isThumbnailFileDisabled = Boolean(blogForm.thumbnailUrl.trim());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Blogs & Offers</h1>
        <p className="text-sm text-gray-500 mt-1">
          Website content, video blogs, coupons, aur automatic offers yahin se manage honge.
        </p>
      </div>

      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <div className="flex gap-2 min-w-max p-1">
          {[
            { id: "blogs", label: "Blog Videos" },
            { id: "offers", label: "Offers & Coupons" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                ? "bg-gray-800 text-white shadow-md"
                : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "blogs" && (
        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
          <form onSubmit={saveBlog} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-gray-800">{editingBlogId ? "Update Blog" : "Add Blog"}</h2>
            <Field label="Blog Title">
              <input className="w-full border rounded-xl px-4 py-3 text-sm" placeholder="Title" value={blogForm.title} onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })} required />
            </Field>
            <Field label="Description">
              <textarea className="w-full border rounded-xl px-4 py-3 text-sm resize-none" rows={3} placeholder="Description" value={blogForm.description} onChange={(e) => setBlogForm({ ...blogForm, description: e.target.value })} />
            </Field>
            <Field label="Video/Image URL">
              <input
                className="w-full border rounded-xl px-4 py-3 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                placeholder="Enter a direct media URL"
                value={blogForm.mediaUrl}
                onChange={(e) => handleBlogTextChange("mediaUrl", e.target.value)}
                disabled={isMediaUrlDisabled}
              />
              {blogErrors.mediaUrl && <p className="mt-1 text-xs text-red-600">{blogErrors.mediaUrl}</p>}
            </Field>
            <Field label="Upload Media File">
              <input
                className="w-full border rounded-xl px-4 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:font-bold file:text-orange-700 disabled:bg-gray-100 disabled:text-gray-400"
                type="file"
                accept={blogForm.mediaType === "video" ? "video/*" : "image/*"}
                onChange={(e) => handleBlogFileChange("mediaFile", e.target.files?.[0] || null)}
                disabled={isMediaFileDisabled}
              />
              <p className="mt-1 text-xs text-gray-400">
                Use either a media link or a media file. Only {blogForm.mediaType} files are allowed here. Maximum size: 5 MB.
              </p>
              {blogFiles.mediaFile && <p className="mt-1 text-xs text-green-600">Selected: {blogFiles.mediaFile.name}</p>}
              {blogErrors.mediaFile && <p className="mt-1 text-xs text-red-600">{blogErrors.mediaFile}</p>}
            </Field>
            <Field label="Thumbnail URL">
              <input
                className="w-full border rounded-xl px-4 py-3 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                placeholder="Enter a thumbnail image URL"
                value={blogForm.thumbnailUrl}
                onChange={(e) => handleBlogTextChange("thumbnailUrl", e.target.value)}
                disabled={isThumbnailUrlDisabled}
              />
              {blogErrors.thumbnailUrl && <p className="mt-1 text-xs text-red-600">{blogErrors.thumbnailUrl}</p>}
            </Field>
            <Field label="Thumbnail Image File">
              <input
                className="w-full border rounded-xl px-4 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:font-bold file:text-orange-700 disabled:bg-gray-100 disabled:text-gray-400"
                type="file"
                accept="image/*"
                onChange={(e) => handleBlogFileChange("thumbnailFile", e.target.files?.[0] || null)}
                disabled={isThumbnailFileDisabled}
              />
              <p className="mt-1 text-xs text-gray-400">
                Use either a thumbnail link or a thumbnail image file. Only image files are allowed. Maximum size: 5 MB.
              </p>
              {blogFiles.thumbnailFile && <p className="mt-1 text-xs text-green-600">Selected: {blogFiles.thumbnailFile.name}</p>}
              {blogErrors.thumbnailFile && <p className="mt-1 text-xs text-red-600">{blogErrors.thumbnailFile}</p>}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Media Type">
                <select
                  className="w-full border rounded-xl px-4 py-3 text-sm"
                  value={blogForm.mediaType}
                  onChange={(e) => {
                    const nextMediaType = e.target.value;
                    const selectedMediaFile = blogFiles.mediaFile;
                    const shouldClearSelectedFile =
                      selectedMediaFile &&
                      ((nextMediaType === "video" && !selectedMediaFile.type.startsWith("video/")) ||
                        (nextMediaType === "image" && !selectedMediaFile.type.startsWith("image/")));

                    setBlogForm({ ...blogForm, mediaType: nextMediaType });

                    if (shouldClearSelectedFile) {
                      setBlogFiles((current) => ({ ...current, mediaFile: null }));
                      setBlogErrors((current) => ({
                        ...current,
                        mediaFile: `The selected file was cleared because media type is now ${nextMediaType}.`,
                      }));
                    } else {
                      setBlogErrors((current) => ({ ...current, mediaFile: "" }));
                    }
                  }}
                >
                  <option value="video">Video</option>
                  <option value="image">Image</option>
                </select>
              </Field>
              <Field label="Index">
                <input className="w-full border rounded-xl px-4 py-3 text-sm" type="number" placeholder="Index" value={blogForm.sortOrder} onChange={(e) => setBlogForm({ ...blogForm, sortOrder: e.target.value })} />
              </Field>
            </div>
            <button className="w-full bg-orange-600 text-white rounded-xl py-3 font-bold">{editingBlogId ? "Save Blog" : "Upload Blog"}</button>
            {editingBlogId && <button type="button" onClick={() => { setEditingBlogId(null); setBlogForm(emptyBlog); setBlogFiles(emptyBlogFiles); setBlogErrors({ mediaFile: "", thumbnailFile: "", mediaUrl: "", thumbnailUrl: "" }); }} className="w-full bg-gray-100 rounded-xl py-3 font-bold text-gray-600">Cancel Edit</button>}
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blogs.map((blog) => (
              <div key={blog._id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-3">
                  {blog.mediaType === "video" ? (
                    <video src={blog.mediaUrl} poster={blog.thumbnailUrl} controls className="w-full h-full object-cover" />
                  ) : (
                    <img src={blog.mediaUrl} alt={blog.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-gray-800">{blog.title}</h3>
                    <p className="text-xs text-gray-400">Index: {blog.sortOrder}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${blog.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{blog.isActive ? "Active" : "Inactive"}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{blog.description}</p>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <button onClick={() => editBlog(blog)} className="bg-blue-50 text-blue-600 rounded-lg py-2 text-xs font-bold">Edit</button>
                  <button onClick={async () => { await api.put(`/admin/blogs/${blog._id}/toggle`); fetchBlogs(); }} className={`${blog.isActive ? "bg-yellow-50 text-yellow-700" : "bg-green-50 text-green-700"} rounded-lg py-2 text-xs font-bold`}>
                    {blog.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={async () => { await api.delete(`/admin/blogs/${blog._id}`); fetchBlogs(); }} className="bg-red-50 text-red-600 rounded-lg py-2 text-xs font-bold">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "offers" && (
        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
          <form onSubmit={saveOffer} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-gray-800">{editingOfferId ? "Update Offer" : "Add Offer"}</h2>
            <Field label="Offer Title">
              <input className="w-full border rounded-xl px-4 py-3 text-sm" placeholder="Offer title" value={offerForm.title} onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })} required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Offer Type">
                <select className="w-full border rounded-xl px-4 py-3 text-sm" value={offerForm.applyType} onChange={(e) => setOfferForm({ ...offerForm, applyType: e.target.value })}>
                  <option value="manual">Manual Coupon</option>
                  <option value="automatic">Automatic Applied</option>
                </select>
              </Field>
              <Field label="Discount Type">
                <select className="w-full border rounded-xl px-4 py-3 text-sm" value={offerForm.discountType} onChange={(e) => setOfferForm({ ...offerForm, discountType: e.target.value })}>
                  <option value="fixed">Fixed Rs.</option>
                  <option value="percentage">Percentage %</option>
                </select>
              </Field>
            </div>
            {offerForm.applyType === "manual" && (
              <Field label="Coupon Code">
                <input className="w-full border rounded-xl px-4 py-3 text-sm uppercase" placeholder="Coupon code e.g. SAVE50" value={offerForm.code} onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value.toUpperCase() })} required />
              </Field>
            )}
            <div className="grid grid-cols-3 gap-3">
              <Field label={offerForm.discountType === "percentage" ? "Discount %" : "Discount Rs."}>
                <input className="w-full border rounded-xl px-4 py-3 text-sm" type="number" min="0" placeholder="Discount" value={offerForm.discountValue} onChange={(e) => setOfferForm({ ...offerForm, discountValue: e.target.value })} />
              </Field>
              <Field label="Min Price">
                <input className="w-full border rounded-xl px-4 py-3 text-sm" type="number" min="0" placeholder="Min order" value={offerForm.minOrderAmount} onChange={(e) => setOfferForm({ ...offerForm, minOrderAmount: e.target.value })} />
              </Field>
              <Field label="Index">
                <input className="w-full border rounded-xl px-4 py-3 text-sm" type="number" placeholder="Index" value={offerForm.sortOrder} onChange={(e) => setOfferForm({ ...offerForm, sortOrder: e.target.value })} />
              </Field>
            </div>
            <button className="w-full bg-orange-600 text-white rounded-xl py-3 font-bold">{editingOfferId ? "Save Offer" : "Add Offer"}</button>
            {editingOfferId && <button type="button" onClick={() => { setEditingOfferId(null); setOfferForm(emptyOffer); }} className="w-full bg-gray-100 rounded-xl py-3 font-bold text-gray-600">Cancel Edit</button>}
          </form>

          <div className="space-y-3">
            {offers.map((offer) => (
              <div key={offer._id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-gray-800">{offer.title}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${offer.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{offer.isActive ? "Active" : "Inactive"}</span>
                    <span className="text-xs font-bold px-2 py-1 rounded bg-orange-50 text-orange-700">{offer.applyType}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {offer.code ? `Code: ${offer.code}` : "Auto applied"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                      {offer.discountType === "percentage" ? `Discount: ${offer.discountValue}%` : `Discount: Rs. ${offer.discountValue}`}
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                      Min Price: Rs. {offer.minOrderAmount}
                    </span>
                    <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                      Index: {offer.sortOrder}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => editOffer(offer)} className="bg-blue-50 text-blue-600 rounded-lg px-4 py-2 text-xs font-bold">Edit</button>
                  <button onClick={async () => { await api.put(`/admin/offers/${offer._id}/toggle`); fetchOffers(); }} className={`${offer.isActive ? "bg-yellow-50 text-yellow-700" : "bg-green-50 text-green-700"} rounded-lg px-4 py-2 text-xs font-bold`}>
                    {offer.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={async () => { await api.delete(`/admin/offers/${offer._id}`); fetchOffers(); }} className="bg-red-50 text-red-600 rounded-lg px-4 py-2 text-xs font-bold">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentOffers;
