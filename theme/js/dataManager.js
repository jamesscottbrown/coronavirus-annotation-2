export const dataKeeper = [];
export const currentUser = [];
export const annotationData = [];

export const originalDimension = {width: 960, height:540, margin: 80};
export const middleDimension = {width: 800, height: 450, margin: 70};
export const smallerDimension = {width: 720, height: 405, margin: 70};

export function getRightDimension(){
  if(window.innerWidth < 1330){
    return smallerDimension;
  }else if(window.innerWidth > 1596){
    return originalDimension;
  }else{
    return middleDimension;
  }
}

export function formatTime(timeInSeconds) {
  const result = new Date(timeInSeconds * 1000).toISOString().substr(11, 8);

  return {
    minutes: result.substr(3, 2),
    seconds: result.substr(6, 2),
  };
}

export function formatVideoTime(videoTime) {
  const time = parseInt(videoTime);
  const minutes = Math.floor(time / 60);
  const seconds = (time - (minutes * 60));

  return `${minutes}:${(`0${seconds}`).slice(-2)}`;
}

export function formatAnnotationTime(d) {
  return d.map((m) => {
    if (m.video_time.includes('-')) {
      const range = m.video_time.split('-');

      const start = range[0].split(':');
      const startSec = (+start[0] * 60) + +start[1];

      const end = range[1].split(':');
      const endSec = (+end[0] * 60) + +end[1];
      m.seconds = [startSec, endSec];
    } else {
      const time = m.video_time.split(':');

      const seconds = (+time[0] * 60) + +time[1];

      m.seconds = [seconds];
    }

    return m;
  });
}
