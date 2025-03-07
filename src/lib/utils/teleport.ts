export function teleport(node: HTMLElement, name = 'teleport-container') {
    const teleportContainer = document.getElementById(name);
    teleportContainer?.appendChild(node);
  
    return {
      destroy() {
        node.remove();
      }
    };
}

export const modalBackdropClick = (node: HTMLElement): { destroy: () => void } => {
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
  
      if (target.id === 'model-outside') {
        node.dispatchEvent(new CustomEvent('clickedOutsideModal'));
      }
    };
  
    const timeoutId = setTimeout(() => {
      window.addEventListener('mousedown', handleClick);
    }, 200);
  
    return {
      destroy: (): void => {
        clearTimeout(timeoutId);
        window.removeEventListener('mousedown', handleClick);
      }
    };
};