import api from '../utils/api';

export const getNotifications = () => api.get('/notifications').then((r) => r.data.notifications);
export const markRead = (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data.notification);

export default { getNotifications, markRead };
