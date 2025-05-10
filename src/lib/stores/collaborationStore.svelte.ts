let space: string = $state('personala');

export function getSpace() {
  return space;
}

export function setSpace(newSpace: string) {
  space = newSpace;
}
