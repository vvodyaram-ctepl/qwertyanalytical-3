// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // baseUrl:'http://35.208.6.100:8080/wearables',
   baseUrl: 'https://35.209.223.199/wearables_service',
  //  baseUrl: 'https://35.208.120.124/wearables_service', //qa
  //  baseUrl: 'http://localhost:8080/wearables', //qa
  baseUrl2: '',
  grantType: 'password',
  clientId: 'adminClientId',
  clientSecret: 'wearablesAdmin',
  tokenString: 'userToken',
  userId: 'userId',
  refreshTokenString: 'userRefreshToken'
  // API_ENDPOINT:"http://10.200.10.123:7777/pawsqc/"
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
