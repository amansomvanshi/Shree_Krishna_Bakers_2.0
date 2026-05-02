import { useEffect, useState } from "react";
import api from "../utils/api";

const defaultAvailability = {
  enabled: true,
  openingTime: "07:30",
  closingTime: "22:45",
  timezone: "Asia/Kolkata",
  opensAtLabel: "7:30 AM",
  closesAtLabel: "10:45 PM",
  isCurrentlyOpen: true,
  statusLine: "Checking store availability...",
  adminStatusLine: "Checking store availability...",
  checkoutNotice: "Checking store availability...",
  closedMessage: "We are not serviceable currently.",
};

const useStoreAvailability = ({ admin = false, autoRefreshMs = 0 } = {}) => {
  const [storeAvailability, setStoreAvailability] =
    useState(defaultAvailability);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAvailability = async (showLoader = true) => {
      if (showLoader && isMounted) {
        setLoading(true);
      }

      try {
        const endpoint = admin
          ? "/admin/settings/store-timing"
          : "/user/store-availability";
        const { data } = await api.get(endpoint);

        if (isMounted) {
          setStoreAvailability({ ...defaultAvailability, ...data });
        }
      } catch (error) {
        console.error("Failed to fetch store availability", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAvailability(true);

    if (!autoRefreshMs) {
      return () => {
        isMounted = false;
      };
    }

    const intervalId = window.setInterval(() => {
      fetchAvailability(false);
    }, autoRefreshMs);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [admin, autoRefreshMs]);

  return {
    storeAvailability,
    loading,
    setStoreAvailability,
  };
};

export default useStoreAvailability;
