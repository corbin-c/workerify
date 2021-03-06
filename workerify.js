const strToWorker = (str) => {
  str = URL.createObjectURL(new Blob([str], {type: "application/javascript"}));
  let worker = new Worker(str);
  URL.revokeObjectURL(str);
  return worker;
}
const Workerify = (target,context=[],instances=1) => {
  let worker = {};
  worker.promises = [];
  worker.instances = instances;
  worker.workers = [...(new Array(worker.instances)).fill({})];
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
    onMessage += "\n}";     
  }
  onMessage += ";\n";
  context = context.map(e => {
    if (typeof e.value === "function") {
      e.value = e.value.toString();
    } else {
        e.value = "{\n"+Object.keys(e.value).map(k => {
        let out = JSON.stringify(k)+": ";
        if (typeof e.value[k] === "function") {
          out+=e.value[k].toString();
        } else {
          out+=JSON.stringify(e.value[k])
        }
        return out;
      }).join(",\n")+"\n}";
    }
    e.value = "let "+e.name+" = "+e.value;
    return e.value;
  }).join(";\n");
  worker.workers = worker.workers.map((e,i) => {
    let subworker = strToWorker(onMessage+context);
    subworker.onmessage = (e) => {
      worker.promises.find(p => p.id == e.data.id).resolve(e.data.resolve);
    };
    return subworker;
  });
  let callWorker = (task,...args) => {
    return (...args) => {
      worker.tasks++;
      worker.workers[worker.tasks%worker.instances].postMessage({
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
