export function serializeNotification(notification: any) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    description: notification.content,
    actor: notification.sender
      ? {
          id: notification.sender.id,
          name: notification.sender.name,
          avatarUrl: notification.sender.avatarUrl,
        }
      : null,
    resourceUrl: notification.resourceUrl || null,
    metadata: notification.metadata || null,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  };
}
