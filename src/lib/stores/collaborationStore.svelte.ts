let space: string = $state('personal');

export function getSpace() {
  return space;
}

export function setSpace(newSpace: string) {
  space = newSpace;
}
