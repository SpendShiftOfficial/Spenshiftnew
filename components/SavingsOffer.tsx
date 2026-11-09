import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './savings-offer.module.css';
const features=['A plan based on your answers','Help with every area worth checking','Clear steps and free comparison tools','Possible savings only when the costs are known','A checklist and a place to record your results'];
export default function SavingsOffer({page='home'}:{page?:'home'|'pricing'|'included'|'how'}){
 const title=page==='pricing'?'Start free. Your full plan is A$39.':page==='included'?'Know what you get before you pay.':page==='how'?'From your answers to clear next steps.':'Find where your money goes. Learn how to keep more.';
 return <div className={styles.page}><Header/><main className={styles.wrap}>
  <section className={styles.hero}><span className={styles.eyebrow}>MADE FOR AUSTRALIANS</span><h1>{title}</h1><p>Check your bills and spending. Get simple steps made for your answers.</p><a className={styles.primary} href='/audit'>Start my free money check</a><p className={styles.small}>8 questions. No bank login. No card needed for free results.</p></section>
  <section className={styles.grid} aria-label='How it works'>{[['1','Start with a free check','Answer eight short questions. See every area worth a closer look.'],['2','Choose your full plan','Pay A$39 once. No subscription or second upgrade.'],['3','Tell us a little more','Add the bills and costs you know. Skip anything you do not know.'],['4','Follow your plan','Start with the most useful steps. Check what you actually save.']].map(([n,t,b])=><article key={n}><span className={styles.number}>{n}</span><h2>{t}</h2><p>{b}</p></article>)}</section>
  <section className={styles.offer}><div><span className={styles.eyebrow}>YOUR STEP-BY-STEP SAVINGS PLAN</span><h2>Less guesswork. Clear next steps.</h2><p>The free check shows where to look. The paid plan explains what to do, why it fits your answers, and how to check the result.</p><ul>{features.map(f=><li key={f}>{f}</li>)}</ul></div><div className={styles.priceBox}><strong>A$39</strong><span>One-time payment</span><p>After payment, there are short questions about your relevant areas. The time needed depends on how many areas you check. Your progress is saved.</p><a className={styles.primary} href='/audit'>Start with my free check</a><small>We do not compare live offers for you or promise a set saving.</small></div></section>
  <section className={styles.example}><span className={styles.eyebrow}>WHAT A PLAN HELPS YOU DO</span><h2>Your bills. Your choices. Your next step.</h2><p>Find an unused subscription. Plan fewer takeaway orders. Compare a bill using the same cover or service. Each step should fit your answers, not someone else's life.</p><p>A bill is a cost, not a saving. We show a possible saving only when the figures support it. You can record the result after making a change.</p></section>
  <section className={styles.faq} id='faq'><h2>Before you start</h2>{[
   ['Will you promise how much I can save?','No. Your costs and the changes you choose affect what you can save. A possible saving is not money already saved.'],
   ['What happens after I pay?','You go to questions about the areas in your plan. Add what you know. Skip unknown amounts. You can save, leave, and return through your private purchase link.'],
   ['Do I have to cancel things I use?','No. The plan should help you make better choices, not tell you to give up what matters to you.'],
   ['Is this a subscription?','No. The full plan costs A$39 once.'],
   ['What if I need help with my purchase?','Email info@spendshift.com.au using your purchase email. Our terms explain refunds and your rights.'],
  ].map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}<p><a href='/terms-and-conditions'>Read the terms</a> · <a href='/whats-included'>See what is included</a></p></section>
  <section className={styles.last}><h2>Start with your free check.</h2><a className={styles.primary} href='/audit'>Check my bills and spending</a><p>General money guidance, not personal financial product advice.</p></section>
 </main><Footer/></div>;
}
