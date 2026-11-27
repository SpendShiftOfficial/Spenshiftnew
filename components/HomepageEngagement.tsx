import type {DashboardSummary} from "@/lib/analytics-v2/dashboard.mjs";
const fmt=(v:number|null)=>v===null?"N/A":v.toLocaleString("en-AU");
const ratio=(v:number|null)=>v===null?"N/A":(100*v).toFixed(1)+"%";
export default function HomepageEngagement({home}:{home:DashboardSummary["homeEngagement"]}){
 return <section style={{border:"1px solid #d7e0d8",borderRadius:12,padding:16,margin:"12px 0",overflowX:"auto"}}>
  <h2>Homepage engagement</h2><p>Recorded homepage views: {fmt(home.views)}. Foreground viewing time is not proof of attention. Sections count sampled visibility of approximately one second; CTA impressions also count trusted activation. Counts are per page view, not unique people. Small or missing counts are N/A; ratios are directional.</p>
  <table style={{width:"100%"}}><thead><tr><th scope="col">Foreground threshold</th><th scope="col">Observations</th><th scope="col">Share of views</th></tr></thead><tbody>{home.time.map(x=><tr key={x.label}><th scope="row" style={{textAlign:"left"}}>{x.label}</th><td>{fmt(x.count)}</td><td>{ratio(x.ratio)}</td></tr>)}</tbody></table>
  <h3>Homepage section reach</h3><table style={{width:"100%"}}><thead><tr><th scope="col">Section</th><th scope="col">Observations</th><th scope="col">Share of views</th></tr></thead><tbody>{home.sections.map(x=><tr key={x.label}><th scope="row" style={{textAlign:"left"}}>{x.label}</th><td>{fmt(x.count)}</td><td>{ratio(x.ratio)}</td></tr>)}</tbody></table>
  <h3>Homepage CTA performance</h3><table style={{width:"100%"}}><thead><tr><th scope="col">Location</th><th scope="col">Impressions</th><th scope="col">Clicks</th><th scope="col">Click ratio</th></tr></thead><tbody>{home.ctas.map(x=><tr key={x.label}><th scope="row" style={{textAlign:"left"}}>{x.label}</th><td>{fmt(x.impressions)}</td><td>{fmt(x.clicks)}</td><td>{ratio(x.ratio)}</td></tr>)}</tbody></table>
 </section>;
}
