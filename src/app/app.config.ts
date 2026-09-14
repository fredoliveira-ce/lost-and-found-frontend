import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { wakeUpInterceptor } from './core/interceptors/wake-up.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // wakeUpInterceptor is listed last so it sits closest to the actual
    // network call - it needs to retry a cold-start failure itself before
    // errorInterceptor (listed earlier, so further from the network call)
    // ever sees it and shows a message.
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor, wakeUpInterceptor]),
    ),
  ],
};
