import {normalizeUsername, usernameEmail} from './username.js';
const publicKey='sb_publishable_4DzMuO6nmtNRTh2qOUXu0Q_JIf-PF50';
const headers={'Access-Control-Allow-Origin':'https://yisuscraiz.github.io','Access-Control-Allow-Headers':'apikey, content-type, authorization, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.method!=='POST')return reply({error:'Método no permitido.'},405);
  // Public signup endpoint. The public app key identifies the client; it is not a user credential.
  if(req.headers.get('apikey')!==publicKey)return reply({error:'Cliente no reconocido.'},401);
  try {
    const text=await req.text();if(text.length>4096)return reply({error:'Solicitud demasiado grande.'},413);
    const body=JSON.parse(text), username=normalizeUsername(body.username), password=body.password;
    if(typeof password!=='string'||password.length<8||password.length>128)return reply({error:'La contraseña debe tener entre 8 y 128 caracteres.'},400);
    const base=Deno.env.get('SUPABASE_URL')!,secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminHeaders={'apikey':secret,'Authorization':`Bearer ${secret}`,'Content-Type':'application/json'};
    const limit=await fetch(`${base}/rest/v1/rpc/animejj_allow_signup`,{method:'POST',headers:adminHeaders,body:'{}'});
    if(!limit.ok)return reply({error:'El registro no está disponible temporalmente.'},503);
    if(await limit.json()!==true)return reply({error:'Se alcanzó el límite temporal de registros. Inténtalo en una hora.'},429);
    const response=await fetch(`${base}/auth/v1/admin/users`,{method:'POST',headers:adminHeaders,body:JSON.stringify({email:usernameEmail(username),password,email_confirm:true,user_metadata:{username}})});
    if(!response.ok){const error=await response.json();return reply({error:error.code==='email_exists'||error.error_code==='email_exists'?'Ese usuario ya está ocupado.':'No se pudo crear la cuenta. El usuario puede estar ocupado o la contraseña no cumplir los requisitos.'},400);}
    return reply({ok:true},201);
  }catch(error){return reply({error:error instanceof SyntaxError?'Solicitud inválida.':error instanceof Error && error.message.startsWith('Usa entre')?error.message:'No se pudo completar el registro.'},400);}
});
