export interface Configuration {
  DEBUG: boolean;
  API_HOST: string;
  WS_HOST: string;
  DOC_HOST: string;
}

const config: Configuration = {
  DEBUG: true,
  API_HOST: '//cloudform.ptt.com:8080/api/',
  WS_HOST: 'wss://cloudform.ptt.com:8080/ws/',
  DOC_HOST: '//cloudform.ptt.com:3000/docs',
};

export default config;
// export const API_HOST = "//cloudform.ptt.com:8080/api/";
