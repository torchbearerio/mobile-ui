export const retrieveRoute = (originLat, originLong, destLat, destLong, pipeline) => {
  return new Promise((resolve, reject) => {
    fetch('http://routemanager.torchbearer.io/route', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        origin_lat: originLat,
        origin_long: originLong,
        destination_lat: destLat,
        destination_long: destLong,
        pipeline: pipeline
      })
    })
      .then((res) => {
        if (res.ok) {
          resolve(res.json());
        }
        else {
          reject();
        }
      })
      .catch((e) => {
        reject(e);
      });
  });
};

export const retrieveLandmarkForExecutionPoint = (epId, pipeline) => {
  return new Promise((resolve, reject) => {
    fetch(`http://routemanager.torchbearer.io/executionpoint/${epId}/landmark?pipeline=${pipeline}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then((res) => {
        if (res.ok) {
          resolve(res.json());
        }
        else {
          reject();
        }
      })
      .catch((e) => {
        console.warn(`Unable to retrieve updated landmark for next turn: ${e.message}`)
      });
  });
};