import type {NextConfig} from 'next';
const nextConfig:NextConfig={
 async headers(){
  const privateRoutes=['/audit','/results','/success','/personalise','/report/:path*','/report-preview','/plan-preview','/api/:path*','/internal/analytics/:path*'];
  const csp="default-src 'self'; script-src 'self' 'unsafe-inline'"+(process.env.NODE_ENV==='development'?" 'unsafe-eval'":'')+"; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://checkout.stripe.com";
  return [{source:'/:path*',headers:[{key:'Referrer-Policy',value:'no-referrer'},{key:'X-Content-Type-Options',value:'nosniff'}]},...privateRoutes.map(source=>({source,headers:[{key:'Cache-Control',value:'private, no-store, max-age=0'},{key:'Referrer-Policy',value:'no-referrer'},{key:'X-Robots-Tag',value:'noindex, nofollow, noarchive'},{key:'Content-Security-Policy',value:csp}]})),{source:'/internal/analytics/access',headers:[{key:'Content-Security-Policy',value:csp.replace("connect-src 'self'","connect-src 'self' https://isbmbayaorsfujexejku.supabase.co")}]}];
 }
};export default nextConfig;
