const strToWorker = (str) => {
  str = URL.createObjectURL(new Blob([str], {type: "application/javascript"}));
  let worker = new Worker(str);
  URL.revokeObjectURL(str);
  return worker;
}
const Workerify = (target) => {
  let worker = {};
  worker.promises = [];
  worker.tasks = 0;
  let onMessage = () => {
    if (typeof target !== "function") {
      return async (e) => {
        postMessage({id:e.data.id,
        resolve:await ghost[e.data.task](...e.data.args)});
      };
    } else {
      return async (e) => {
        postMessage({id:e.data.id,
        resolve:await ghost(...e.data.args)});
      };
    }
  };
  onMessage = "onmessage = "+onMessage(target.name).toString()+"\nlet ghost = ";
  if (typeof target === "function") {
    onMessage += target.toString();
  } else {
    onMessage += "{\n";
    onMessage += Object.keys(target)
      .map(e => e+": "+target[e].toString()).join(",\n");
    onMessage += "\n}\n";     
  }
  worker.worker = strToWorker(onMessage);
  worker.worker.onmessage = (e) => {
    worker.promises.find(p => p.id == e.data.id).resolve(e.data.resolve);
  }
  let callWorker = (task,...args) => {
    return (...args) => {
      worker.tasks++;
      worker.worker.postMessage({
        id:worker.tasks,
        args:args,
        task:task
      });
      return new Promise((resolve,reject) => {
        worker.promises.push({id:worker.tasks,resolve:resolve,reject:reject});
      });
    }
  }
  if (typeof target === "function") {
    return callWorker(false);
  } else {
    let out = {}
    Object.keys(target).map(e => {out[e] = callWorker(e)});
    return out;
  }
}
export { Workerify };
