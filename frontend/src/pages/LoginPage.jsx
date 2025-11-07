import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthProvider';

export default function LoginPage(){
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e){
    e.preventDefault();
    setLoading(true);
    try{
      await login(email, password);
      navigate('/whatsapp');
    }catch(err){
      console.error(err);
      alert(err.response?.data?.message || 'فشل تسجيل الدخول');
    }finally{ setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">تسجيل الدخول</h2>
      <form onSubmit={submit} className="space-y-3">
        <input required value={email} onChange={e=>setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="w-full p-2 border rounded"/>
        <input required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full p-2 border rounded"/>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded transition">
  {loading ? 'جارٍ...' : 'دخول'}
</button>
        </div>
      </form>
    </div>
  )
}
