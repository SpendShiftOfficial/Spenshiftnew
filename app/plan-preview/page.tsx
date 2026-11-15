import {notFound} from 'next/navigation';
import DemoPlan from './DemoPlan';
export const metadata={title:'Test savings plan',robots:{index:false,follow:false}};
export default function Page(){if(process.env.VERCEL_ENV!=='preview'&&process.env.NODE_ENV!=='development')notFound();return <DemoPlan/>;}
