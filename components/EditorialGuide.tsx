import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./editorial-guide.module.css";

export type EditorialSource = { label: string; url: string; note: string };
export type EditorialSection = {
  id: string;
  heading: string;
  paragraphs: string[];
  steps?: { title: string; text: string }[];
  bullets?: string[];
  sources?: EditorialSource[];
};
export type EditorialGuideData = {
  label: string;
  title: string;
  intro: string;
  answer: string;
  quickChecks: string[];
  reviewed: string;
  sections: EditorialSection[];
  example: { title: string; premise: string; lines: string[]; result: string; caution: string };
  questions: { question: string; answer: string }[];
  sources: EditorialSource[];
  related: { url: string; title: string; description: string }[];
};
export default function EditorialGuide({ guide }: { guide: EditorialGuideData }) {
  return <div className={styles.page}>
    <Header />
    <main className={styles.wrap}>
      <article>
        <header className={styles.hero}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span>
            <Link href="/save-money-australia">Money-saving guides</Link>
          </nav>
          <span className={styles.eyebrow}>{guide.label}</span>
          <h1>{guide.title}</h1>
          <p className={styles.lead}>{guide.intro}</p>
          <p className={styles.byline}>By SpendShift · Reviewed {guide.reviewed}</p>
        </header>
        <section className={styles.answer} aria-label="Short answer">
          <h2>The short answer</h2>
          <p>{guide.answer}</p>
          <h3>Start with these checks</h3>
          <ul>{guide.quickChecks.map(x=><li key={x}>{x}</li>)}</ul>
        </section>
        <nav className={styles.toc} aria-label="On this page">
          <h2>On this page</h2>
          <ul>{guide.sections.map(s=><li key={s.id}><a href={"#"+s.id}>{s.heading}</a></li>)}
            <li><a href="#example">Worked example</a></li><li><a href="#questions">Common questions</a></li>
          </ul>
        </nav>
        {guide.sections.map(section=><section className={styles.section} key={section.id} id={section.id}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map(p=><p key={p}>{p}</p>)}
          {section.steps&&<ol className={styles.steps}>{section.steps.map(step=><li key={step.title}><strong>{step.title}</strong><p>{step.text}</p></li>)}</ol>}
          {section.bullets&&<ul className={styles.bullets}>{section.bullets.map(b=><li key={b}>{b}</li>)}</ul>}
          {section.sources&&<p className={styles.sectionSources}>Official resources: {section.sources.map((x,i)=><span key={x.url}>{i>0?" · ":""}<a href={x.url} target="_blank" rel="noopener noreferrer">{x.label}</a></span>)}</p>}
        </section>)}
        <section className={styles.example} id="example">
          <span className={styles.eyebrow}>MADE-UP EXAMPLE · NOT A CURRENT QUOTE</span>
          <h2>{guide.example.title}</h2>
          <p>{guide.example.premise}</p>
          <div className={styles.math}>{guide.example.lines.map(x=><p key={x}>{x}</p>)}<strong>{guide.example.result}</strong></div>
          <p className={styles.caution}>{guide.example.caution}</p>
        </section>
        <section className={styles.section} id="questions">
          <h2>Common questions</h2>
          <div className={styles.questions}>{guide.questions.map(({question,answer})=><details key={question}>
            <summary>{question}</summary><p>{answer}</p>
          </details>)}</div>
        </section>
        <section className={styles.sources} aria-labelledby="source-heading">
          <h2 id="source-heading">Sources and how we checked this guide</h2>
          <p>SpendShift checked the official consumer information below on {guide.reviewed}. We are not a government service or a live comparison site. Prices, rules and terms can change, so check the original source before acting.</p>
          <ul>{guide.sources.map(source=><li key={source.url}>
            <a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a>
            <span>{source.note}</span>
          </li>)}</ul>
          <p className={styles.small}>General educational information only. We do not promise that a particular change will save you money.</p>
        </section>
        <section className={styles.related} aria-labelledby="related-heading">
          <h2 id="related-heading">Keep reading</h2>
          <div>{guide.related.map(item=><Link href={item.url} key={item.url}>
            <strong>{item.title}</strong><span>{item.description}</span>
          </Link>)}</div>
        </section>
        <section className={styles.cta} aria-labelledby="cta-heading">
          <h2 id="cta-heading">Want help checking your own spending?</h2>
          <p>Answer eight free questions. See which costs may be worth checking and where to start. You can stop after your free results.</p>
          <Link href="/audit" className={styles.button}>Start my free savings check</Link>
          <p className={styles.small}>No bank login. No card for free results. The optional full plan costs A$29 once.</p>
        </section>
      </article>
    </main>
    <Footer />
  </div>;
}
