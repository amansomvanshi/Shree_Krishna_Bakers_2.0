import React from "react";
import { motion } from "framer-motion";
import { Phone, Mail, Instagram, MapPin, MessageCircle } from "lucide-react";

const ContactUs = () => {
  const contacts = [
    {
      icon: MapPin,
      title: "Our Outlets",
      content: "Tonk Road | Sitapura, Jaipur",
      color: "bg-blue-100/50 text-blue-600",
    },
    {
      icon: Phone,
      title: "Queries & Orders",
      content: "+91 9982849056",
      action: "tel:+919982849056",
      color: "bg-green-100/50 text-green-600",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      content: "+91 6378748049",
      action: "https://wa.me/916378748049?text=hello",
      color: "bg-green-100/50 text-green-600",
    },
    {
      icon: Mail,
      title: "Email Support",
      content: "ramkishanyadav9222@gmail.com",
      action: "mailto:ramkishanyadav9222@gmail.com",
      color: "bg-red-100/50 text-red-600",
    },
    {
      icon: Instagram,
      title: "Follow Us",
      content: "@shrikrishnabakers",
      action:
        "https://www.instagram.com/shri_krishna_baker?igsh=MWJjbjc1bWViem41Ng==",
      color: "bg-purple-100/50 text-purple-600",
      description: "Behind-the-scenes making videos & updates",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 5 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-gray-50 pb-24"
    >
      <div className="w-full max-w-[600px] mx-auto bg-white min-h-screen shadow-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-8 pt-12 rounded-b-[40px] shadow-lg text-white">
          <h1 className="text-3xl font-extrabold">Contact Us</h1>
          <p className="mt-2 text-orange-100 font-medium italic">
            "We'd Love to Hear From You!"
          </p>
        </div>

        <div className="p-6 pt-10 space-y-6">
          <p className="text-center text-gray-500 text-sm mb-4">
            Feel free to reach out for orders, queries, or just to say hi!
          </p>

          <div className="grid grid-cols-1 gap-4">
            {contacts.map((item, index) => (
              <div key={index} className="group">
                {item.action ? (
                  <a
                    href={item.action}
                    target={item.action.startsWith("http") ? "_blank" : "_self"}
                    rel="noreferrer"
                    className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all active:scale-[0.98]"
                  >
                    <div className={`${item.color} p-4 rounded-xl`}>
                      <item.icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {item.title}
                      </h3>
                      <p className="font-bold text-gray-800 text-lg break-all">
                        {item.content}
                      </p>
                      {item.description && (
                        <p className="text-xs text-gray-400 mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </a>
                ) : (
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                    <div className={`${item.color} p-4 rounded-xl`}>
                      <item.icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {item.title}
                      </h3>
                      <p className="font-bold text-gray-800 text-lg">
                        {item.content}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* WhatsApp Quick Action */}
          <div className="mt-10">
            <a
              href="https://wa.me/916378748049?text=hello"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-transform active:scale-95"
            >
              <MessageCircle size={24} />
              Chat on WhatsApp
            </a>
          </div>

          <div className="text-center pt-8">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Shri Krishna Bakers. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ContactUs;
