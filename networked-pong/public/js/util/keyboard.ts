export default (value: string) => {
    const key: {
      value: string,
      isDown: boolean,
      isUp: boolean,
      press: any,
      release: any,
      downHandler: Function,
      upHandler: Function,
      unsubscribe: Function
    } = {
      value: value,
      isDown: false,
      isUp: true,
      press: undefined,
      release: undefined,
      downHandler: (event: any) => {
        if (event.key === key.value) {
          if (key.isUp && key.press) key.press();
          key.isDown = true;
          key.isUp = false;
          event.preventDefault();
        }
      },
      upHandler: (event: any) => {
        if (event.key === key.value) {
          if (key.isDown && key.release) key.release();
          key.isDown = false;
          key.isUp = true;
          event.preventDefault();
        }
      },
      unsubscribe: () => {
        window.removeEventListener("keydown", downListener);
        window.removeEventListener("keyup", upListener);
      }
    };
    
  
    //Attach event listeners
    const downListener = key.downHandler.bind(key);
    const upListener = key.upHandler.bind(key);
    
    window.addEventListener(
      "keydown", downListener, false
    );
    window.addEventListener(
      "keyup", upListener, false
    );
    
    return key;
  }