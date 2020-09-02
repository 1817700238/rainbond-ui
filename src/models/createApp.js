import {
  createAppByCode,
  createThirtAppByCodes,
  createThirdPartyServices,
  createAppByCompose,
  createAppByDockerrun,
  buildApp,
  installApp,
  getAppsByComposeId
} from "../services/createApp";

export default {
  namespace: "createApp",

  state: {
    extend_method: "",
    min_memory: "",
    service_runtimes: "",
    service_server: "",
    service_dependency: ""
  },
  effects: {
    *getAppsByComposeId({ payload, callback }, { call, put }) {
      const data = yield call(getAppsByComposeId, payload);
      if (data) {
        callback && callback(data);
      }
    },
    *installApp({ payload, callback }, { call, put }) {
      const data = yield call(installApp, payload);
      if (data) {
        callback && callback(data);
      }
    },
    *createAppByCode({ payload, callback }, { call, put }) {
      const data = yield call(createAppByCode, payload);
      if (data) {
        setTimeout(() => {
          callback && callback(data);
        });
      }
    },
    *createThirtAppByCode({ payload, callback }, { call, put }) {
      const data = yield call(createThirtAppByCodes, payload);
      if (data) {
        setTimeout(() => {
          callback && callback(data);
        });
      }
    },

    *createThirdPartyServices({ payload, callback }, { call, put }) {
      const data = yield call(createThirdPartyServices, payload);
      if (data) {
        setTimeout(() => {
          callback && callback(data);
        });
      }
    },
    *createAppByCompose({ payload, callback }, { call, put }) {
      const data = yield call(createAppByCompose, payload);
      if (data) {
        setTimeout(() => {
          callback && callback(data);
        });
      }
    },
    *createAppByDockerrun({ payload, callback }, { call, put }) {
      const data = yield call(createAppByDockerrun, payload);
      if (data) {
        setTimeout(() => {
          callback && callback(data);
        });
      }
    },
    *buildApps({ payload, callback }, { call }) {
      const data = yield call(buildApp, payload);
      if (data && callback) {
        callback(data);
      }
    }

    // buildApp
  },

  reducers: {
    saveRuntimeInfo(state, { payload }) {
      return {
        ...state,
        ...payload
      };
    },
    clearRuntimeInfo(state) {
      return {
        extend_method: "",
        min_memory: "",
        service_runtimes: "",
        service_server: "",
        service_dependency: ""
      };
    }
  }
};
