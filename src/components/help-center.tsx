"use client";

import Link from "next/link";
import { useState } from "react";
import { IconArrowRight, IconSearch } from "@tabler/icons-react";
import { helpArticles } from "../data/help-articles";

const categories = ["All", ...new Set(helpArticles.map((article) => article.category))];

export function HelpCenter() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const normalizedQuery = query.trim().toLowerCase();
  const visible = helpArticles.filter((article) => (category === "All" || article.category === category) && (!normalizedQuery || `${article.title} ${article.summary} ${article.category} ${article.steps.join(" ")}`.toLowerCase().includes(normalizedQuery)));

  return <section className="help-browser" aria-label="Help articles"><div className="help-search"><IconSearch size={19} aria-hidden="true" /><label className="sr-only" htmlFor="help-search">Search Help Center</label><input id="help-search" type="search" placeholder="Search help articles" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="help-categories" aria-label="Help categories">{categories.map((item) => <button key={item} type="button" className={item === category ? "active" : ""} aria-pressed={item === category} onClick={() => setCategory(item)}>{item}</button>)}</div><p className="help-result-count" aria-live="polite">{visible.length} {visible.length === 1 ? "article" : "articles"}</p><div className="help-grid">{visible.map((article) => <article className="help-card" key={article.slug}><p className="eyebrow">{article.category}</p><h2>{article.title}</h2><p>{article.summary}</p><Link className="text-link" href={`/help/${article.slug}`}>Read article <IconArrowRight size={16} aria-hidden="true" /></Link></article>)}</div>{visible.length === 0 && <div className="help-no-results"><h2>No matching articles</h2><p>Try a tool, worker, billing, or privacy term.</p><button type="button" onClick={() => { setQuery(""); setCategory("All"); }}>Show all articles</button></div>}</section>;
}
