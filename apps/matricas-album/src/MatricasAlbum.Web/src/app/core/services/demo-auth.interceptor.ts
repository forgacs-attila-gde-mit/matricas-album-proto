import { HttpInterceptorFn } from '@angular/common/http';

const demoTokenKey = 'ma-demo-token';
const demoRoleKey = 'ma-demo-role';
type DemoRole = 'teacher' | 'student' | 'closure';

export const demoAuthInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) {
    return next(req);
  }

  const token = localStorage.getItem(demoTokenKey)?.trim();
  if (!token) {
    return next(req);
  }

  const role = localStorage.getItem(demoRoleKey) === 'student' ? 'student' : 'teacher';
  return next(req.clone({
    setHeaders: {
      'X-Demo-Token': token,
      'X-Demo-Role': role,
    },
  }));
};

export function setDemoRequestRole(role: DemoRole): void {
  localStorage.setItem(demoRoleKey, role === 'student' ? 'student' : 'teacher');
}
