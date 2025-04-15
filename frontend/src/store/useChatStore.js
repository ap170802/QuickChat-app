import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users"); // Added null check
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");  // Added null check
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message"); // Added null check
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    if (!socket) {
      console.warn("Socket is not connected.  Ensure socket is initialized in useAuthStore.");
      return; // Important:  Don't proceed if no socket.
    }

    socket.on("newMessage", (newMessage) => {
      const currentSelectedUser = get().selectedUser; // Get latest selectedUser
      if (!currentSelectedUser) return; //check if user is still selected

      const isMessageFromSelectedUser = newMessage.senderId === currentSelectedUser._id;
      if (isMessageFromSelectedUser) {
        set({
          messages: [...get().messages, newMessage],
        });
      }
    });
    // No return here.  The subscription lives as long as the component.
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
     if (socket) { // check if socket exists
        socket.off("newMessage");
     }
  },

  setSelectedUser: (user) => {
    set({ selectedUser: user });
    if(user){
       get().getMessages(user._id); //load messages when user is selected
    }

  },
}));
