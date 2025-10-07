"use client";

import React from "react";
import Link from "next/link";
import Modal from "@/components/Modal";
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

type ProjectStatus = "active" | "ended";
type ProjectType = "Pre-TGE" | "Post-TGE" | "Community Build Opportunities" | "Campaign";

interface TgeProjectRow {
  project: string;
  backers: string[];
  backersData: any[];
  infoPlatforms: string[];
  amountRaised: string;
  reward: string;
  type: ProjectType;
  status: ProjectStatus;
}

interface PlatformImages {
  projects: Record<string, string>;
  backers: Record<string, string>;
  platforms: Record<string, string>;
}

interface TGEPageClientProps {
  projects: any[];
  platformImages: PlatformImages;
  apiError: string | null;
}

const STATUS_OPTIONS: { key: ProjectStatus; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "ended", label: "Ended" },
];

const TYPE_OPTIONS: { key: ProjectType; label: string }[] = [
  { key: "Pre-TGE", label: "Pre-TGE" },
  { key: "Post-TGE", label: "Post-TGE" },
  { key: "Community Build Opportunities", label: "Community Build Opportunities" },
  { key: "Campaign", label: "Campaign" },
];

const SORT_OPTIONS = [
  { key: "amount-desc", label: "Highest Raise" },
  { key: "amount-asc", label: "Lowest Raise" },
  { key: "project-asc", label: "Project A-Z" },
  { key: "project-desc", label: "Project Z-A" },
];

const getTypeDisplayName = (type: ProjectType) =>
  type === "Community Build Opportunities" ? "Build" : type;

export default function TGEPageClient({
  projects: rawProjects,
  platformImages: initialPlatformImages,
  apiError
}: TGEPageClientProps) {
  const [statusFilters, setStatusFilters] = React.useState<string[]>(["all"]);
  const [typeFilters, setTypeFilters] = React.useState<string[]>([]);
  const [platformFilters, setPlatformFilters] = React.useState<string[]>([]);
  const [sortBy, setSortBy] = React.useState<string>("amount-desc");
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const filterRef = React.useRef<HTMLDivElement>(null);

  const [isListModalOpen, setIsListModalOpen] = React.useState(false);
  const [listModalTitle, setListModalTitle] = React.useState<string>("");
  const [listModalType, setListModalType] = React.useState<"backer"|"platform">("backer");
  const [listModalItems, setListModalItems] = React.useState<string[]>([]);
  const [listModalBackersData, setListModalBackersData] = React.useState<any[]>([]);

  const projects = React.useMemo<TgeProjectRow[]>(
    () =>
      rawProjects.map((pr: any) => ({
        project: pr.name,
        backers: pr.backers?.map((b: any) => b.name) || [],
        backersData: pr.backers || [],
        infoPlatforms: pr.platforms || [],
        amountRaised: pr.amountRaised ? `$${(pr.amountRaised/1e6).toFixed(1)}M` : "",
        reward: pr.rewards || "",
        type: pr.type || "Campaign",
        status: pr.status?.toLowerCase()==="ended"?"ended":"active"
      })),
    [rawProjects]
  );

  const platformImages = React.useMemo<PlatformImages>(() => {
    const p: PlatformImages = {projects:{},backers:{},platforms:initialPlatformImages.platforms||{}};
    rawProjects.forEach((pr: any)=>{
      if(pr.image) p.projects[pr.name]=pr.image;
      pr.backers?.forEach((b: any)=>{ if(b.image) p.backers[b.name]=b.image });
    });
    return p;
  },[rawProjects,initialPlatformImages]);

  const openListModal = (title:string,type:"backer"|"platform",items:string[],backers?:any[])=>{
    setListModalTitle(title);
    setListModalType(type);
    setListModalItems(items);
    setListModalBackersData(backers||[]);
    setIsListModalOpen(true);
  };

  const filtered = React.useMemo(()=>{
    let base=[...projects];
    if(searchQuery.trim()){
      const q=searchQuery.toLowerCase();
      base=base.filter(r=>r.project.toLowerCase().includes(q)
        ||r.backers.some(b=>b.toLowerCase().includes(q))
        ||r.infoPlatforms.some(p=>p.toLowerCase().includes(q))
        ||r.type.toLowerCase().includes(q));
    }
    if(!statusFilters.includes("all")) base=base.filter(r=>statusFilters.includes(r.status));
    if(typeFilters.length) base=base.filter(r=>typeFilters.includes(r.type));
    if(platformFilters.length) base=base.filter(r=>r.infoPlatforms.some(p=>platformFilters.includes(p)));
    base.sort((a,b)=>{
      switch(sortBy){
        case"amount-desc":return parseFloat(b.amountRaised.replace(/[$,M]/g,""))-parseFloat(a.amountRaised.replace(/[$,M]/g,""));
        case"amount-asc":return parseFloat(a.amountRaised.replace(/[$,M]/g,""))-parseFloat(b.amountRaised.replace(/[$,M]/g,""));
        case"project-asc":return a.project.localeCompare(b.project);
        case"project-desc":return b.project.localeCompare(a.project);
        default:return 0;
      }
    });
    return base;
  },[projects,searchQuery,statusFilters,typeFilters,platformFilters,sortBy]);

  const getActiveFilterCount=()=>[
    ...new Set([
      ...statusFilters.filter(s=>s!=="all"),
      ...typeFilters, ...platformFilters
    ])
  ].length;

  const handleStatusToggle=(s:string)=>{
    if(s==="all") setStatusFilters(["all"]);
    else{
      const nl=statusFilters.includes(s)?statusFilters.filter(x=>x!==s&&x!=="all"):[...statusFilters.filter(x=>x!=="all"),s];
      setStatusFilters(nl.length?nl:["all"]);
    }
  };
  const handleTypeToggle=(t:string)=>setTypeFilters(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t]);

  React.useEffect(()=>{
    const out=(e:MouseEvent)=>{if(filterRef.current&&!filterRef.current.contains(e.target as Node))setIsFilterOpen(false)};
    if(isFilterOpen)document.addEventListener("mousedown",out);
    return()=>document.removeEventListener("mousedown",out);
  },[isFilterOpen]);

  const allPlatforms=React.useMemo(()=>[...new Set(projects.flatMap(r=>r.infoPlatforms))].sort(),[projects]);

  const getStatusBadgeClass = (status: ProjectStatus, compact: boolean = false, isSelected: boolean = false) => {
    const base = compact ? "px-2 py-1 text-xs" : "px-2.5 py-1.5 text-sm";
    switch (status) {
      case "active":
        return isSelected
          ? `${base} rounded bg-green-600 text-white`
          : `${base} rounded bg-green-500/20 text-green-300`;
      case "ended":
        return isSelected
          ? `${base} rounded bg-zinc-600 text-white`
          : `${base} rounded bg-zinc-500/20 text-zinc-300`;
      default:
        return isSelected
          ? `${base} rounded bg-zinc-600 text-white`
          : `${base} rounded bg-zinc-500/20 text-zinc-300`;
    }
  };

  const getTypeBadgeClass = (type: ProjectType, compact: boolean = false, isSelected: boolean = false) => {
    const base = compact ? "px-2 py-1 text-xs" : "px-2.5 py-1.5 text-sm";
    switch (type) {
      case "Pre-TGE":
        return isSelected
          ? `${base} rounded bg-blue-600 text-white`
          : `${base} rounded bg-blue-500/20 text-blue-300`;
      case "Post-TGE":
        return isSelected
          ? `${base} rounded bg-purple-600 text-white`
          : `${base} rounded bg-purple-500/20 text-purple-300`;
      case "Community Build Opportunities":
        return isSelected
          ? `${base} rounded bg-orange-600 text-white`
          : `${base} rounded bg-orange-500/20 text-orange-300`;
      case "Campaign":
        return isSelected
          ? `${base} rounded bg-pink-600 text-white`
          : `${base} rounded bg-pink-500/20 text-pink-300`;
      default:
        return isSelected
          ? `${base} rounded bg-gray-600 text-white`
          : `${base} rounded bg-gray-500/20 text-gray-300`;
    }
  };

  return (
    <div className="text-white min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h1 className="text-3xl font-bold text-white text-center lg:text-left">Campaigns</h1>
          <div className="flex items-center gap-4 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 lg:flex-initial lg:w-80">
              <input
                type="text"
                placeholder="Search projects, backers, platforms..."
                value={searchQuery}
                onChange={e=>setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-[#151820] border border-[#2a2e35] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            {/* Filters */}
            <div className="relative" ref={filterRef}>
              <button
                className={`flex items-center gap-2 px-3 py-2 border rounded transition ${
                  isFilterOpen||getActiveFilterCount()>0
                    ? "bg-purple-500/60 text-white border-purple-400"
                    : "bg-purple-500/20 text-gray-300 border-purple-400 hover:bg-purple-500/60 hover:text-gray-100"
                }`}
                onClick={()=>setIsFilterOpen(p=>!p)}
              >
                <span className="text-sm font-medium">Filters</span>
                <span className="px-1.5 py-0.5 text-xs bg-purple-400 text-white rounded-full">
                  {getActiveFilterCount()}
                </span>
              </button>
              {isFilterOpen && (
                <div className="absolute right-0 z-40 w-80 p-4 mt-2 bg-[#151820] rounded-lg shadow-xl">
                  {/* Status */}
                  <div className="mb-4">
                    <h3 className="mb-2 text-sm font-medium text-white">Status</h3>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map(o=>{
                        const isSelected = statusFilters.includes(o.key);
                        return(
                          <button
                            key={o.key}
                            className={`${getStatusBadgeClass(o.key as ProjectStatus, true, isSelected)} border border-transparent`}
                            onClick={()=>handleStatusToggle(o.key)}
                          >
                            {o.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Type */}
                  <div className="mb-4">
                    <h3 className="mb-2 text-sm font-medium text-white">Type</h3>
                    <div className="flex flex-wrap gap-2">
                      {TYPE_OPTIONS.map(o=>{
                        const isSelected = typeFilters.includes(o.key);
                        return(
                          <button
                            key={o.key}
                            className={`${getTypeBadgeClass(o.key as ProjectType, true, isSelected)} border border-transparent`}
                            onClick={()=>handleTypeToggle(o.key)}
                          >
                            {o.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Sort */}
                  <div className="mb-4">
                    <h3 className="mb-2 text-sm font-medium text-white">Sort By</h3>
                    <div className="space-y-2">
                      {SORT_OPTIONS.map(o=>{
                        const sel=sortBy===o.key;
                        return(
                          <label key={o.key} className="flex items-center cursor-pointer">
                            <input type="radio" name="sort" checked={sel} onChange={()=>setSortBy(o.key)} className="sr-only"/>
                            <div className={`w-4 h-4 border-2 rounded-full mr-3 flex items-center justify-center ${
                              sel?"border-purple-400 bg-purple-400":"border-gray-400"
                            }`}>
                              {sel && <div className="w-2 h-2 bg-white rounded-full"/>}
                            </div>
                            <span className="text-sm text-gray-300">{o.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  {/* Platforms */}
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-white">Platforms</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {allPlatforms.map(p=>{
                        const sel=platformFilters.includes(p);
                        return(
                          <label key={p} className="flex items-center cursor-pointer">
                            <input type="checkbox" checked={sel}
                              onChange={()=>setPlatformFilters(prev=>prev.includes(p)?prev.filter(x=>x!==p):[...prev,p])}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${
                              sel?"border-purple-400 bg-purple-400":"border-gray-400"
                            }`}>
                              {sel && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" clipRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  />
                                </svg>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <img
                                src={initialPlatformImages.platforms[p.toLowerCase()]||""}
                                alt={p}
                                className="w-4 h-4 rounded-full object-cover"
                                onError={e=>(e.target as HTMLImageElement).style.display="none"}
                              />
                              <span className="text-sm text-gray-300">{p}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FIXED: Removed overflow-x-auto from outer div, added height constraint */}
        <div className="w-full border-y border-[#2a2e35] rounded-t-lg max-h-[100vh] overflow-auto">  
          {apiError && (
            <div className="p-3 mb-2 bg-red-500/10 border border-red-500/20 rounded-t-lg">
              <div className="flex items-center gap-2 text-red-300 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" clipRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  />
                </svg>
                <span>{apiError}</span>
              </div>
            </div>
          )}
          <table className="min-w-[1280px] text-left text-sm w-full">
            {/* UPDATED: Made header sticky */}
            <thead className="bg-[#151820] text-[#A3A3A3] sticky top-0 z-30">
              <tr>
                <th className="sticky left-0 z-40 w-8 px-2 py-3 bg-[#151820] font-semibold">#</th>
                <th className="sticky left-8 z-40 w-52 px-4 py-3 bg-[#151820] font-semibold">Projects</th>
                <th className="w-28 px-4 py-3 font-semibold">Type</th>
                <th className="w-64 px-4 py-3 font-semibold">Backers (VCs)</th>
                <th className="w-36 px-4 py-3 font-semibold">Amount Raised</th>
                <th className="w-40 px-4 py-3 font-semibold">Rewards</th>
                <th className="w-44 px-4 py-3 font-semibold">InfoFi Platform</th>
                <th className="w-28 px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row,idx)=>(
                <tr key={`${row.project}-${idx}`} className="group bg-black border-t border-[#2a2e35] hover:bg-[#151820]">
                  <td className="sticky left-0 z-10 w-8 px-2 py-3 bg-black group-hover:bg-[#151820] text-[#A3A3A3] whitespace-nowrap">
                    <span className="px-1 py-1 text-xs font-medium rounded bg-[rgba(21,24,32,0.6)]">{idx+1}</span>
                  </td>
                  <td className="sticky left-8 z-10 w-52 px-4 py-3 bg-black group-hover:bg-[#151820] text-white whitespace-nowrap">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={platformImages.projects[row.project]||""}
                        alt={row.project}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={e=>(e.target as HTMLImageElement).style.display="none"}
                      />
                      <Tippy content={row.project} disabled={!row.project}>
                        <Link
                          href={`/dashboard/tge/${row.project.toLowerCase().replace(/\s+/g,"-")}`}
                          className="truncate text-sm font-bold transition-colors hover:text-purple-300"
                        >
                          {row.project}
                        </Link>
                      </Tippy>
                    </div>
                  </td>
                  <td className="w-28 px-4 py-3 font-medium">
                    <span className={getTypeBadgeClass(row.type, true)}>
                      {getTypeDisplayName(row.type)}
                    </span>
                  </td>
                  <td className="w-64 px-4 py-3 font-medium text-[#ffffffcc]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {row.backers.slice(0,1).map(b=>(
                        <span key={b} className="flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-[rgba(71,79,92,0.35)] min-w-0 max-w-[200px]">
                          <img
                            src={platformImages.backers[b]||""}
                            alt={b}
                            className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                            onError={e=>(e.target as HTMLImageElement).style.display="none"}
                          />
                          <Tippy content={b} disabled={!b}>
                            <span className="truncate">{b}</span>
                          </Tippy>
                        </span>
                      ))}
                      {row.backers.length>1 && (
                        <button
                          className="flex-shrink-0 px-2 py-1 text-xs text-purple-300 bg-purple-500/20 border border-purple-400/30 rounded hover:bg-purple-500/40 whitespace-nowrap"
                          onClick={()=>openListModal(`${row.project} · Backers`,"backer",row.backers,row.backersData)}
                        >
                          +{row.backers.length-1}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="w-36 px-4 py-3 text-sm font-medium text-white">
                    <div className="min-w-0 max-w-36">
                      <Tippy content={row.amountRaised} disabled={!row.amountRaised}>
                        <span className="block truncate">{row.amountRaised}</span>
                      </Tippy>
                    </div>
                  </td>
                  <td className="w-40 px-4 py-3 text-sm font-medium text-white">
                    <div className="min-w-0 max-w-40">
                      <Tippy content={row.reward} disabled={!row.reward}>
                        <span className="block truncate">{row.reward}</span>
                      </Tippy>
                    </div>
                  </td>
                  <td className="w-44 px-4 py-3 font-medium text-[#ffffffcc]">
                    <div className="flex flex-wrap gap-1.5 min-w-0">
                      {row.infoPlatforms.slice(0,1).map(p=>(
                        <span key={p} className="flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-[rgba(42,46,53,0.35)] min-w-0">
                          <img
                            src={platformImages.platforms[p.toLowerCase()]||""}
                            alt={p}
                            className="w-4 h-4 rounded-full object-cover"
                            onError={e=>(e.target as HTMLImageElement).style.display="none"}
                          />
                          <Tippy content={p} disabled={!p}>
                            <span className="truncate">{p}</span>
                          </Tippy>
                        </span>
                      ))}
                      {row.infoPlatforms.length>1 && (
                        <button
                          className="flex-shrink-0 px-2 py-1 text-xs text-purple-300 bg-purple-500/20 border border-purple-400/30 rounded hover:bg-purple-500/40"
                          onClick={()=>openListModal(`${row.project} · Info Platforms`,"platform",row.infoPlatforms)}
                        >
                          +{row.infoPlatforms.length-1}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="w-28 px-4 py-3 font-medium">
                    <span className={getStatusBadgeClass(row.status, true)}>
                      {STATUS_OPTIONS.find(s=>s.key===row.status)?.label}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-[#A3A3A3]">No results</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isListModalOpen} onClose={()=>setIsListModalOpen(false)}>
        <div className="space-y-3">
          <div className="text-lg font-semibold text-white">{listModalTitle}</div>
          {listModalType==="backer"?(
            <div className="space-y-4">
              {(() => {
                const tiers: Record<string, any[]> = {};
                const angel: any[] = [];
                listModalBackersData.forEach(b=>{
                  if(b.tier){
                    const k=`Tier ${b.tier}`;
                    tiers[k]=tiers[k]||[];
                    tiers[k].push(b);
                  } else angel.push(b);
                });
                return (
                  <>
                    {Object.keys(tiers).sort().map(t=>(
                      <div key={t}>
                        <h4 className="mb-2 text-sm font-medium text-gray-300">{t}</h4>
                        <div className="flex flex-wrap gap-2">
                          {tiers[t].map((b,i)=>(
                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-[rgba(71,79,92,0.35)] rounded">
                              <img src={platformImages.backers[b.name]||""} alt={b.name} className="w-4 h-4 rounded-full object-cover" onError={e=>(e.target as HTMLImageElement).style.display="none"} />
                              <span>{b.name}</span>
                              <span className="ml-1 text-xs text-gray-400">{b.type}</span>
                              {b.round && <span className="ml-1 text-xs text-gray-400">({b.round})</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {angel.length>0 && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-gray-300">Angel</h4>
                        <div className="flex flex-wrap gap-2">
                          {angel.map((b,i)=>(
                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-[rgba(71,79,92,0.35)] rounded">
                              <img src={platformImages.backers[b.name]||""} alt={b.name} className="w-4 h-4 rounded-full object-cover" onError={e=>(e.target as HTMLImageElement).style.display="none"} />
                              <span>{b.name}</span>
                              <span className="ml-1 text-xs text-gray-400">{b.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          ):(
            <div className="flex flex-wrap gap-2">
              {listModalItems.map(item=>(
                <span key={item} className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-[rgba(42,46,53,0.35)] rounded">
                  <img src={platformImages.platforms[item.toLowerCase()]||""} alt={item} className="w-4 h-4 rounded-full object-cover" onError={e=>(e.target as HTMLImageElement).style.display="none"} />
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
