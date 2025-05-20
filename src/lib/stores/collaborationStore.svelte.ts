import { conversationStore } from '$lib/stores/conversationStore';

let space: string = $state('personal');

export function getSpace() {
  return space;
}

export function setSpace(newSpace: string) {
  if (space === newSpace) return; // Avoid unnecessary reloads if space hasn't changed
  space = newSpace;
  // When space changes, reload conversations with forceReload = true
  conversationStore.loadConversations(true);
}
