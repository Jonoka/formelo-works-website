# DEV-05H · Launch copy for editorial review

**Status: proposed English copy; not factory-approved, not saved to Sanity, not published.** Prepared on 2026-09-20 from the existing ten-URL scope and installed Studio fields. FORMELO WORKS is a provisional editorial brand, not a confirmed final brand or legal entity.

This file is a copy proposal and field-level entry specification, not another factory-facts register, import script or alternative website data source. The only factual questions/confirmation register remains [the factory materials checklist](factory-materials-checklist.md#dev-05h--工厂可直接回答的问题). Current technical field contracts remain in [CMS mapping](../development/cms-editorial-mapping.md). No application imports this file; default mock content is unchanged.

## How to read and enter this proposal

**Confirmed scope** means the user-approved website identity, provisional brand, routes and current disabled/non-production controls. It does not mean manufacturing capability has been verified. **General guidance** means buyer questions or planning explanations, not a factory service or policy. **Proposed copy** is the English text below, still awaiting editorial review. **Withheld** means there is no defensible factory-specific value; do not insert the word “withheld”, an editorial note or a placeholder into that CMS field.

Only explicitly supplied copy/structural/status fields in each section are candidates for a separately authorized Draft write. Field paths are literal. Page documents have a `pageKey`, not a `slug` or a CMS `referenceCode`. Every new page uses `templateContent._type=pageTemplateContent` and a matching `templateContent.pageKey`; no generic builder or legacy Home object migration is proposed. Every `seo` contains only `seoTitle` and `seoDescription`; the existing layout handles the brand suffix.

Rows in a section table map to `templateContent.sections.<key>.{eyebrow,title,description}`. Rows in an information table map, in order, to `<field>[].{title,description}`; FAQ rows map to `faqItems[].{question,answer}`. Use the installed named object types and unique array `_key` values when entering these fields. Do not store Markdown table syntax in a string field or use an entire Markdown document as Portable Text.

For the two body sections explicitly marked below, paragraphs become normal Portable Text blocks, the identified H2/H3 become plain-text heading blocks, tables become `editorialTable`/`editorialTableRow`, the identified note becomes `editorialCallout`, and the quantity enquiry becomes `editorialTemplate`. Use only the existing `editorialBody` contract. No HTML, embeds, invented assets or unready reference annotations are included. Mechanical encoding must preserve the reviewed text and be checked before any authorized save; this Markdown delivery is not a claim that an encoded payload has already passed a tool or the published converter.

`publishedAt`, every `factConfirmedAt`/MOQ `confirmedAt`, `publicUseApproved`, `authorDisplay` and policy effective/review dates are **not supplied**. `contentUpdatedAt` is also excluded from this first proposed write: the preparation date above is not an exact CMS content timestamp. Record actual substantive editorial version timing separately and map it only when established and approved; never derive public/fact dates from Git, a build, `_updatedAt` or a save-only operation. `siteSettings` has no `contentUpdatedAt` field. Validation failures caused by genuinely missing fields remain visible; they are not a reason to add fake values or weaken the schema.

## 1. Site settings

**Basis:** the provisional brand and disabled channels are confirmed project choices. Factory identity, commercial terms and media permissions are unconfirmed. There is no general purchasing explanation to store as `defaultMoq`.

Proposed Draft ID: `drafts.siteSettings` (`siteSettings` singleton). Creation remains conditional on a fresh selector/ID check and separate approval.

| Field | Proposed value or entry state |
|---|---|
| `brandName` | `FORMELO WORKS` — use only within this explicitly provisional editorial Draft; final brand review remains open |
| `channelStatus.emailEnabled` | `false` |
| `channelStatus.whatsappEnabled` | `false` |
| `factoryName`, `contactPersonOrTeam`, `businessHours`, `timezone`, `publicAddress`, `email`, `whatsappDigits` | Withheld: actual public information needed; do not infer the factory timezone from the website operator's timezone |
| `defaultMoq` and all its children | Withheld: neither a quantity nor a `projectBased` policy is confirmed |
| `logo`, `defaultOgImage` | Awaiting approved media; leave the complete image fields unset |
| `featuredCategories` | Reference task only; no reference values in this batch |
| `factConfirmedAt` | Withheld: no factual sign-off |

The proposed `brandName` is not a substitute for `factoryName`. No dummy email, telephone, address, business hours or logo is proposed. The provisional text logo in the existing mock website does not satisfy the formal CMS image requirements.

## 2. Home

**Basis:** aimed at emerging clothing brands within the confirmed site scope. The copy below is general project preparation, not an announcement of confirmed small-order capacity. Confirmed manufacturing strengths and the actual factory introduction remain withheld.

Proposed Draft ID: `drafts.page.home`; `pageKey=home`.

| Field | Proposed English copy |
|---|---|
| `title` | Your next collection starts with a clear brief. |
| `intro` | Shape the garment, separate the quantities and make the open questions visible. Start with the information you have, then clarify what needs agreement before sampling or production. |
| `seo.seoTitle` | Clothing project preparation for emerging brands |
| `seo.seoDescription` | Plan your next clothing collection with guidance on garment briefs, style and color quantities, sampling questions and manufacturing responsibilities. |
| `templateContent.eyebrow` | For emerging clothing brands |
| `templateContent.manufacturingSummary.customization` | Describe the starting design and the details you would like to change. Ask which work is available, what information is needed and which decisions require a sample. |
| `templateContent.manufacturingSummary.sampling` | Identify what a sample should resolve, then ask about availability, charges, timing and feedback before proceeding. |

### Home section copy

| Key | Eyebrow | Title | Description |
|---|---|---|---|
| `capabilities` | The right fit for your project | Match the brief to the work. | Compare your garment requirements with confirmed manufacturing capabilities, rather than relying on a broad service label. |
| `categories` | Start with the garment | Two directions for your brief. | Explore different design questions for T-shirts and hoodies. Their inclusion here is not confirmation that a particular garment or specification is available. |
| `factory` | Behind the garment | Know the people and the arrangements. | Before committing to a project, clarify who is responsible for the work and where each stage will take place. |
| `process` | Before a commitment | Make each decision clear. | Use these planning steps to organize the conversation. The actual sequence and responsibilities must be agreed for the project. |
| `journal` | Journal | Better questions. A clearer brief. | Practical reading on preparing a clothing enquiry and understanding quantities by style, color and size. |
| `faq` | A useful starting point | Questions before the next step. | Separate what you know from what you need to confirm before discussing a quotation. |

### `templateContent.processSteps`

| Title | Description |
|---|---|
| Describe the garment | Explain each design, its intended fit and the details that matter most. Mark undecided specifications as questions. |
| Review feasibility | Ask which materials, processes and quantities can be considered, and what information is still needed. |
| Define sample decisions | Where sampling is agreed, identify the review points, costs and feedback arrangements before starting. |
| Agree the next commitment | Confirm the specifications, quantities, responsibilities and commercial terms before making a production decision. |

### `faqItems`

| Question | Answer |
|---|---|
| What should I prepare for a first enquiry? | Describe the garments, number of styles, proposed quantities by style and color, and delivery country. Add references or a tech pack when available and identify the questions still open. |
| Can I start without a tech pack? | You can introduce an idea or a question without a finished tech pack. Ask what additional specifications are needed and whether support is available; design or development services are not assumed to be included. |
| Does a collection total establish the minimum order? | No. Ask what the minimum applies to and whether styles, colors or sizes can be combined. This guide does not announce a factory minimum or a policy for accepting orders. |
| Does a target date confirm a production schedule? | No. Name the milestone you are aiming for, such as sample receipt, dispatch or arrival, and ask what must be settled before a schedule can be assessed. |

**Withheld fields:** `templateContent.capabilities` requires real strengths, not renamed buyer questions; `templateContent.factorySummary` requires the actual factory profile. `heroImage` and optional `templateContent.factoryImage` await approved images. Omit optional `titleLineHints`; no title-dependent layout instructions are needed. Do not add a seventh Home section named manufacturing: the two manufacturing summaries above are the existing fields. These gaps mean the Home Draft is not a complete published Home document.

## 3. Manufacturing

**Basis:** generic buyer preparation based on the existing six anchored sections. All proposed process/option rows are questions or conditional planning steps. None confirms an offered service, a factory workflow, a MOQ policy or a sample allowance.

Proposed Draft ID: `drafts.page.manufacturing`; `pageKey=manufacturing`.

| Field | Proposed English copy |
|---|---|
| `title` | From a garment idea to a manufacturing brief. |
| `intro` | A useful brief makes the garment, quantities and unresolved decisions easy to discuss. Work through the questions below before agreeing a quotation, sample or production run. |
| `seo.seoTitle` | Clothing manufacturing brief, MOQ and sampling questions |
| `seo.seoDescription` | Prepare a clothing manufacturing brief: customization questions, quantities by style and color, sample review points and decisions before production. |
| `templateContent.eyebrow` | Manufacturing / Project preparation |
| `templateContent.contextNote` | This is a preparation guide, not a confirmed list of factory services or commercial terms. Availability and responsibilities require direct agreement. |
| `templateContent.guideTitle` | Plan the conversation |
| `templateContent.preparationLead` | Start with what you know. |
| `templateContent.preparationNote` | A tech pack, company email or registered brand is not a prerequisite for introducing an idea. Explain what is missing and ask what further information or support the project would need. |

### Manufacturing section copy

| Key | Eyebrow | Title | Description |
|---|---|---|---|
| `options` | 01 / Your starting point | Explain what should stay and change. | Describe how far the design has developed before asking which work can be considered. |
| `moq` | 02 / Minimum order quantities | Read the rule behind the number. | Separate style, color and size quantities, then ask which counting basis and material conditions apply. |
| `prepare` | 03 / Your project brief | A few details make a useful start. | Keep the known requirements and unresolved questions together in your own notes. |
| `sampling` | 04 / Sample discussion | Decide what the sample should resolve. | Agree the review scope and sample terms before treating a physical reference as production approval. |
| `production` | 05 / Decisions to agree | From discussion to a defined commitment. | This planning sequence is not a statement of the factory's actual operating procedure. |
| `faq` | 06 / Common questions | Clarify the next step. | Ask for the assumptions and exclusions behind a proposed answer. |
| `related` | Put the brief in context | Look beyond the specification. | Consider the manufacturing responsibilities and the information needed for a direct conversation. |

### `templateContent.options`

| Title | Description |
|---|---|
| Adapting an existing starting point | Explain whether you are looking for an existing garment to adapt. Ask whether a suitable base style and labeling arrangement are available; neither is assumed here. |
| Changing a defined design | Identify the fit, fabric, color, construction or artwork changes you are considering. Ask which changes are feasible and what needs to be reviewed before a quotation. |
| Developing a new idea | Describe the intended wearer, silhouette and key details. Ask which specifications you must supply and whether any development work can be undertaken for this project. |

### `templateContent.moqFactors`

| Title | Description |
|---|---|
| Styles and colors | Give every style and color its own quantity line. Ask whether the minimum applies to each line, each style or another defined grouping. |
| Size allocation | List the proposed sizes within each style and color. Ask about size-level minimums, ratios or pack requirements rather than assuming unrestricted mixing. |
| Fabric and shade | Ask whether the chosen material, color or finish introduces a separate purchasing condition, and which unit is used to measure it. |
| Decoration and components | Ask whether artwork versions, labels, trims or custom packing have separate conditions from the finished garments. |

**MOQ field boundary:** the actual policy still comes from `siteSettings.defaultMoq`, which is withheld. The prose above must not be converted into `mode=projectBased`, a quantity or an inherited category rule.

### `templateContent.preparation`

| Title | Description |
|---|---|
| Garment and style names | Describe what you would like to make. Give each distinct design a working name so that its references and questions stay together. |
| Quantity breakdown | State the proposed pieces for each style and color, then show the sizes within that line. Mark estimates as estimates. |
| Design information | List the sketches, reference images, measurements, artwork or tech pack available now. Explain what each reference is intended to show. |
| Destination and target milestone | Name the delivery country. Explain whether a desired date means sample receipt, dispatch or arrival; a target is not an agreed schedule. |
| Budget and open questions | State the currency and intended scope of any target price or budget. Separate essential details, flexible options and decisions still to be made. |

### `templateContent.sampling`

| Title | Description |
|---|---|
| Set the review points | List the fit, measurements, fabric feel, construction and artwork or trim placement that a sample would need to resolve. |
| Ask about the terms | Confirm whether sampling is available, what it would cost, what the timing depends on and how feedback or changes would be handled. |
| Record the agreed reference | Identify the version and specifications being accepted. Ask what approval is required before a production decision and keep unresolved items visible. |

### `templateContent.productionSteps`

| Title | Description |
|---|---|
| Clarify the brief | Discuss the garment, quantity breakdown, destination and open questions. Establish which parts of the proposal are feasible. |
| Agree a sample review | If sampling is available and agreed, define the review points, feedback process and specifications that need confirmation. |
| Confirm the production scope | Agree the design version, quantities, responsibilities, costs and schedule assumptions before making a commitment. |
| Define checks and delivery | Ask what checks, packing and delivery arrangements can be agreed, and how any difference from the specification would be handled. |

### `faqItems`

| Question | Answer |
|---|---|
| Can I discuss an idea without complete design files? | Yes, an initial conversation can start with ordinary descriptions and references you may share. The specifications required for a quotation or sample, and any available development support, must be discussed separately. |
| Can quantities be pooled across colors or styles? | Do not assume that they can. Show the individual lines and ask which grouping the minimum applies to, including any separate material or component conditions. |
| Are labels, artwork and new-style development included? | No inclusion is assumed by this guide. Describe the result you want and ask which work is available, who would undertake it and whether it is separately charged. |
| Does the planning sequence promise a lead time? | No. Ask what must be confirmed before timing can be assessed, and distinguish sample receipt, production, dispatch and arrival. |

`templateContent.relatedLinks` remains unset pending verified references: “Explore the factory profile” → `pageKey=factory`; “Prepare a direct enquiry” → `pageKey=contact`. These are reference tasks, not stored `_ref` values or instructions to publish the targets.

## 4. Our Factory

**Basis:** the user confirmed that the site represents the factory itself, not an intermediary platform. The factory's public identity, location, history, scale and actual production arrangements have not been supplied. General questions below cannot replace that missing profile.

Proposed Draft ID: `drafts.page.factory`; `pageKey=factory`.

| Field | Proposed English copy |
|---|---|
| `title` | Behind the garment. |
| `intro` | A manufacturing relationship needs more than a finished sample. Clarify who is responsible for the work, where each stage takes place and how decisions are recorded. |
| `seo.seoTitle` | Our factory: responsibilities and quality discussions |
| `seo.seoDescription` | Questions for a direct factory conversation about production responsibilities, agreed specifications and quality checks before a manufacturing commitment. |
| `templateContent.eyebrow` | Our Factory / People and responsibilities |
| `templateContent.contextNote` | The public factory profile and operating arrangements await confirmation. The guidance here does not establish available processes, certifications or inspection guarantees. |
| `templateContent.overviewNote` | The factory identity, public location and original photography will be included only after their accuracy and public use are confirmed. |

### Factory section copy

| Key | Eyebrow | Title | Description |
|---|---|---|---|
| `overview` | The factory profile | Know who stands behind the work. | Review the confirmed identity and manufacturing context before deciding whether the factory fits your project. |
| `arrangements` | Manufacturing responsibilities | Understand where the work happens. | Identify the parties responsible for materials, development, production and finishing; do not assume every stage is performed in-house. |
| `quality` | Questions before agreement | Define what will be checked. | Establish the reference, review scope and communication process for differences from the agreed specification. |
| `related` | Bring the questions together | Connect the profile with your brief. | Use your garment requirements to make the next conversation specific. |

### `templateContent.qualityDiscussion`

| Title | Description |
|---|---|
| Before a production decision | Ask which fit, material, measurement and construction points should be reviewed and what will serve as the agreed reference. |
| During the proposed run | Ask which interim checks can be arranged, what they would cover and who would communicate a difference from the specification. |
| Before dispatch | Discuss the final review scope, packing requirements and how any unresolved issue would be handled. Methods, tolerances and acceptance criteria need explicit agreement. |

**Withheld:** `templateContent.overview` must contain the actual factory introduction; `templateContent.arrangements` must describe the actual allocation of work, not another list of questions presented as operations. Their absence is deliberate and blocks a complete published profile. Optional `heroImage`, `templateContent.gallery` and `templateContent.credentials` stay unset; no stock workshop photo, invented certificate or client logo.

`templateContent.relatedLinks` remains a task: “Prepare a manufacturing brief” → `pageKey=manufacturing`, fragment `prepare`; “Prepare a direct enquiry” → `pageKey=contact`.

## 5. Contact

**Basis:** a direct factory conversation is the intended route; actual channels remain disabled and unconfirmed. The English preparation text is proposed, while the disabled-state statement reflects the current implementation, not a live service promise.

Proposed Draft ID: `drafts.page.contact`; `pageKey=contact`.

| Field | Proposed English copy |
|---|---|
| `title` | Tell us about the garment you have in mind. |
| `intro` | An early idea, a useful reference or a question can begin a clearer brief. Keep the essentials together and identify the decisions you would like to discuss. |
| `seo.seoTitle` | Prepare your clothing enquiry |
| `seo.seoDescription` | Organize your garment ideas, quantities, references and destination before a direct factory conversation. Start with the information you have. |
| `templateContent.eyebrow` | Contact / Your next collection |
| `templateContent.contextNote` | Contact details are not active in this preview. There is no enquiry form or file upload, and this page does not send your notes to the factory. |
| `templateContent.preparationNote` | You do not need a tech pack, company email or registered brand to introduce a project. Share only material you are entitled to share, and ask what further specifications would be needed. |

### Contact section copy

| Key | Eyebrow | Title | Description |
|---|---|---|---|
| `prepare` | Your first enquiry | A few details. In your own words. | Keep these points in your own draft before using a confirmed contact channel. |
| `related` | Still shaping the idea? | Make the garment questions specific. | Return to the preparation guidance and separate your requirements from the decisions still open. |

### `templateContent.preparation`

| Title | Description |
|---|---|
| The garment | Name each design and describe the intended fit, fabric feel and details that matter to the project. |
| The quantity | Break down the proposed pieces by style and color, then add the size allocation and check the total. |
| The information available | Identify the references, measurements or design files you have and explain what each one communicates. |
| Destination and timing | State the delivery country and the milestone you are aiming for. Ask what must be confirmed before a schedule can be assessed. |
| Decisions to discuss | List essential requirements, flexible options and missing specifications. State the currency and scope of any budget target. |

`templateContent.relatedLinks` is not entered yet: “Read the preparation guide” → `pageKey=manufacturing`, fragment `prepare`. All actual contact and business fields remain in `siteSettings`; this page does not duplicate them or enable links, copying or sending.

## 6. Journal

**Basis:** the two established article topics and route are confirmed scope. This is proposed column copy, not a statement that either article has passed factory review or been published.

Proposed Draft ID: `drafts.page.blogIndex`; `pageKey=blogIndex`.

| Field | Proposed English copy |
|---|---|
| `title` | Journal |
| `intro` | A clearer brief. A more useful conversation. |
| `seo.seoTitle` | Journal: clothing briefs and quantity planning |
| `seo.seoDescription` | Practical reading for clothing brands: what to include in an enquiry and how to separate minimum quantities by style, color and size. |
| `templateContent.eyebrow` | Notes for your next collection |
| `templateContent.columnNote` | These guides help you organize questions before a factory conversation. They explain planning choices, not confirmed manufacturing capabilities, quotations or delivery commitments. |

No article array, publication date, author, third card or duplicate excerpt belongs in this page. Article cards continue to derive from the existing article delivery. Fact and content timing fields follow the withholding rules above.

## 7. Privacy — not in effect

**Basis:** the current preview has disabled contact controls, no enquiry form/upload/checkout and analytics off. This is a description of that limited state, not legal advice, legal approval or a final notice for public operation. No operational provider, entity, retention period or legal basis is inferred from the technical stack.

Proposed Draft ID: `drafts.page.privacy`; `pageKey=privacy`.

| Field | Proposed value / English copy |
|---|---|
| `title` | Privacy notice |
| `intro` | Draft notice for the current website preview. Not in effect. |
| `seo.seoTitle` | Draft privacy notice — not in effect |
| `seo.seoDescription` | A non-effective notice describing the current website preview. Operating details and the final public privacy notice require separate review. |
| `templateContent.eyebrow` | Website information |
| `templateContent.legalReviewStatus` | `pending` |
| `templateContent.policyStatus` | `draft_not_in_effect` |

### Proposed `templateContent.body` — start

This draft describes the current website preview. It is not an operative privacy notice for a live customer service. The provisional brand name does not identify a confirmed legal entity.

#### Current preview (body H2)

The preview has no enquiry form, customer file upload, customer account, subscription or checkout. Analytics is off, and the displayed email and WhatsApp contact controls are disabled. This page does not provide an active route for sending an enquiry.

The enquiry text in the Journal is ordinary selectable page content. Selecting that text does not submit a message or upload a file to the website.

#### Technical activity (body H2)

Viewing a page involves a browser and a serving environment. Development or review tools may create technical records, including requests, errors and test output. The absence of forms and analytics is not a promise that no data is processed anywhere in that environment.

Production hosting, operational logging and the handling of visitor information are not established by this draft. They must be described against the services actually used before public operation.

#### Links and contact channels (body H2)

An ordinary link to an external source takes the visitor to a separate website. Such a link is not an embedded service or a statement that the destination operates this website.

Any future email or WhatsApp communication would be a separate action through the relevant service. The actual recipients and information-handling arrangements must be identified before those channels are activated. This draft does not claim that enquiries have already been sent or received.

#### Before public use (body H2)

The operator's identity, privacy contact, actual service providers, purposes, retention arrangements and request procedures remain to be confirmed. A final notice must describe the actual operation and undergo the appropriate review before taking effect.

No effective date or legal approval is recorded here. This draft does not activate a policy, approve public deployment or certify compliance with a legal regime.

### Proposed `templateContent.body` — end

Leave `legalReviewedAt`, `effectiveAt`, `legalEntity`, `privacyContact`, `providers` and `retention` unset. Current schema forbids filling the latter operating fields in this phase. The corresponding Chinese operating questions stay in the existing checklist, not as invented CMS values. Privacy has no marketing CTA or `referenceCode`.

## 8. T-shirts

**Basis:** T-shirts are an established demonstration route, not a factory-confirmed product category. Proposed copy helps a buyer prepare this type of brief. Specific capabilities, fabric ranges, production samples and MOQ rules remain withheld.

Proposed Draft ID: `drafts.category.t-shirts` — a proposed new ID, not an existing Studio singleton; verify both the ID and logical slug before any authorized creation.

| Field | Proposed value / English copy |
|---|---|
| `name` | T-shirts |
| `slug.current`, `categoryCode` | `t-shirts` |
| `referenceCode` | `WEB-TSHIRTS` |
| `title` | Shape your T-shirt brief. |
| `intro` | Start with the silhouette, neckline and feel you want to achieve. Describe the body and sleeve proportions, the intended sizes and the details you would like to review in a physical reference. This category is not yet a confirmed factory offering. |
| `seo.seoTitle` | T-shirt project brief: fit, neckline and fabric questions |
| `seo.seoDescription` | Prepare a T-shirt brief with fit, neckline, material and artwork questions, quantities by style and color, and the details to discuss before sampling. |
| `customizationNotes` | Describe the body length, shoulder position, sleeve shape, neckline and artwork placement you are considering. For material, explain the desired feel and appearance without treating a reference image as a confirmed composition or weight. Ask which specifications and processes are feasible before agreeing a sample. |
| `samplingNotes` | A proposed T-shirt review can focus on fit, neckline shape, measurements, fabric feel and artwork placement. Ask whether sampling is available, which review points can be covered and how charges, timing and feedback would be handled. No sample service or allowance is confirmed here. |

### `faqItems`

| Question | Answer |
|---|---|
| What should a T-shirt reference communicate? | Explain whether it illustrates the fit, neckline, sleeve proportion, material appearance or artwork placement. Do not treat every detail in a reference as part of the specification. |
| Can I include a preferred fabric weight or composition? | Yes, as a requested specification to be checked. The factory must confirm availability and suitability; this page does not establish an available fabric range. |
| How should I describe printing or embroidery? | Provide the artwork dimensions, placement and desired appearance. Ask which method is feasible for the selected fabric and whether the requirement affects sampling or quantity conditions. |
| How should I state the proposed quantity? | Give each style and color a separate line, with sizes allocated within it. Ask which minimum and mixing conditions apply instead of assuming one quantity for the whole collection. |

Do not enter `heroImage`, `samples`, `capabilityRows`, `moqMode`, `moqOverride`, `evidenceImages`, `relatedArticles` or factual dates in this batch. `moqMode` is deliberately not set to the schema's default `inherit`: the factory has not confirmed a policy to inherit. No mock `concept`, `discussion`, `cardSummary` or `moqNotes` field is copied into this schema. The formal capability/sample/media requirements remain unsatisfied.

## 9. Hoodies

**Basis:** Hoodies are the second demonstration route, not a confirmed offering. This copy focuses on layering, hood construction, inside finish, pockets and trims rather than merely changing the T-shirt name.

Proposed Draft ID: `drafts.category.hoodies`; verify ID and slug immediately before any approved creation.

| Field | Proposed value / English copy |
|---|---|
| `name` | Hoodies |
| `slug.current`, `categoryCode` | `hoodies` |
| `referenceCode` | `WEB-HOODIES` |
| `title` | Define the details of your hoodie. |
| `intro` | Consider how the garment should fit over layers, how the hood should sit and what the inside surface should feel like. Keep pocket, closure and trim requirements attached to the right design. This category is not yet a confirmed factory offering. |
| `seo.seoTitle` | Hoodie project brief: hood, layering and trim questions |
| `seo.seoDescription` | Prepare a hoodie brief around layering room, hood shape, inside finish, pockets and trims. Identify the specifications and sampling questions to confirm. |
| `customizationNotes` | Describe the body and sleeve volume, cuff and hem proportions, hood depth and lining, pocket position and pullover or zip-front direction. Identify the intended wearer and any trim requirements. Ask about main fabric, matching rib, closures and artwork together; none of these sourcing or production options is assumed available. |
| `samplingNotes` | A proposed hoodie review can address layering room, hood shape, pocket position, cuff and hem proportions and trim placement. Ask which points can be assessed in a sample and confirm availability, cost, timing and feedback arrangements before proceeding. |

### `faqItems`

| Question | Answer |
|---|---|
| Should I specify brushed or loopback fabric? | Describe the inside feel and structure you prefer, with a reference where possible. Ask the factory to confirm suitable materials; neither option is promised by this page. |
| Can my brief describe a zip-front design? | Yes, a brief can describe that direction, along with the hood, pocket and closure requirements. Feasibility, sourcing and any quantity or sampling implications still need confirmation. |
| What should I explain about fit? | Describe the room needed over other garments, body length, shoulder position, sleeve volume and intended size range. Ask how measurements and the agreed reference would be recorded. |
| Which components need separate quantity questions? | Ask about the main fabric, matching rib, zippers or other closures, labels and packing. Identify the unit and basis of any separate condition rather than treating a garment total as approval of every component. |

The same withheld field list as T-shirts applies, but the missing facts and samples must be supplied independently for Hoodies. Do not duplicate one category's capability rows, sample codes or approvals to fill the other.

## 10. MOQ article

**Basis:** the existing second article topic and original teaching example, not factory terms. The arithmetic is illustrative and self-contained. No price, factory minimum, material availability or accepted order is inferred. This is a rewritten editorial proposal, not a cloud export or an import of test fixtures.

Proposed Draft ID: `drafts.article.moq-per-style-per-color`; verify ID and logical slug before creation. `_type=article`.

| Field | Proposed value / English copy |
|---|---|
| `title` | Clothing MOQ Explained: Per Style, Per Color and Mixed Sizes |
| `slug.current` | `moq-per-style-per-color` |
| `referenceCode` | `WEB-MOQ-GUIDE` |
| `excerpt` | Read the unit behind a minimum quantity. Separate styles, colors and size allocations before adding up a proposed order. |
| `seo.seoTitle` | Clothing MOQ: per style, per color and mixed sizes |
| `seo.seoDescription` | Understand clothing quantity breakdowns by style, color and size through a clearly hypothetical example, with questions about materials and components. |
| `factReviewStatus` | `pending` |

### Proposed `body` — start

A minimum quantity is difficult to use until you know what it applies to. Is the figure for one garment design, one color of that design, each size or the whole order? Before adjusting a collection to meet a number, ask for the counting rule in writing. The total at the bottom of a brief is only the result of the breakdown above it.

#### Read the minimum together with its unit (body H2)

MOQ means minimum order quantity. In a clothing discussion, the useful question is not only “how many?” but also “for which grouping, under which conditions?” Keep the number, its unit and its scope together when comparing answers.

For this guide, a style means one identified garment design, a color means one color version of that style, and a size allocation describes how the pieces within a style and color are divided among sizes. These are working definitions for organizing questions, not a universal contract. Ask which changes to fabric, fit, construction or artwork would be counted as a new style.

Table caption: **Four different quantity questions**

| Basis | Question to confirm |
|---|---|
| Per style | Does the minimum apply to each design, and which changes create another style? |
| Per color | Must each color of each style meet its own minimum? |
| Mixed sizes | Can one style and color be divided among sizes, and are there size-level conditions? |
| Total order | Is there also an order-wide quantity or value condition, separate from the variant minimums? |

#### Separate styles and colors before adding them (body H2)

Suppose your proposed collection contains a T-shirt and a hoodie. Give each design a working name, then create a line for every color within that design. If the counting rule is per style per color, each line must be evaluated separately.

A larger overall order does not, by arithmetic alone, resolve a shortfall on one line. Choosing the same color name for two garments also does not establish that their material or production arrangements can be shared. Ask whether any pooling is possible rather than treating it as an entitlement.

#### Mixed sizes divide a line; they do not add another total (body H2)

When size mixing is permitted within one style and color, the size quantities divide that line's quantity. They are not extra pieces to count a second time. Write each size and its proposed count, then check that the sum equals the style–color quantity.

Ask whether the split can be freely chosen, whether particular sizes have separate conditions, and whether a ratio or pack multiple applies. The words “mixed sizes” do not identify the actual sizes or quantities in your proposal, and this guide does not assume any grading service or extended-size capability.

#### A hypothetical order, line by line (body H2)

Callout title: **Hypothetical example — not this factory's MOQ**

Callout content: Assume, only for this calculation, a minimum of 60 pieces for each style in each color, with mixed S / M / L sizes permitted within that line and no additional size minimum. These invented conditions are teaching assumptions, not a factory policy, an offer or an accepted order.

Table caption: **Hypothetical proposal: two styles, three style–color lines, 180 pieces total**

| Style / color | S | M | L | Total |
|---|---|---|---|---|
| Style A T-shirt / cream | 15 | 25 | 20 | 60 |
| Style A T-shirt / charcoal | 10 | 30 | 20 | 60 |
| Style B hoodie / charcoal | 20 | 20 | 20 | 60 |

Under these assumptions, the cream T-shirt line is 15 + 25 + 20 = 60 pieces. The charcoal T-shirt line is also 60, so Style A totals 120. Style B totals 60. The complete proposal is 120 + 60 = 180 pieces, not 180 pieces per style and not 60 pieces in every size. Each of the three lines satisfies the assumed rule; that conclusion applies only to this example.

##### Why the same total can produce a different result (body H3)

Now consider 90 cream T-shirts, 30 charcoal T-shirts and 60 charcoal hoodies. The total is still 180, but the 30-piece charcoal T-shirt line falls below the hypothetical 60-piece threshold. Extra cream T-shirts do not fix that line under the assumed rule.

Changing the counting rule changes the calculation. A minimum stated only per style could work differently, while a separate material condition could introduce another constraint. The example makes those questions visible; it does not predict which proposal a factory will accept.

#### Ask about materials and components separately (body H2)

Do not stop at the finished-garment count. Ask whether the fabric, shade, decoration, label or packing requirement has a separate purchasing or preparation condition. A garment-level answer is not approval of every component in the brief.

For fabric, ask what material is available for the project, whether a specific shade or finish has its own minimum, and which unit is used. Before combining material quantities across styles, confirm that the specifications actually allow the material to be shared.

For decoration, identify separate artwork versions, sizes and placements. Ask whether they require separate quantity or setup discussions. For trims and labels, ask about closures, drawcords, main labels and care labels relevant to your design. For packing, ask whether a custom requirement has a different quantity basis from the garments.

If a proposed purchase would leave unused material or components, ask what would happen to the balance and who would bear any agreed cost. Keep units distinct: garment pieces, fabric lengths or weights, and numbers of labels cannot be compared as though they were the same quantity.

#### Discuss the constraint, not just a lower number (body H2)

When a proposed split appears difficult, first identify the constraint. Is it the number of styles, colors, sizes or a component specification? Then explain which part of the brief is flexible. You might ask whether fewer colors, a different material or a simpler decoration requirement could be considered. None guarantees a lower minimum or an acceptable price.

Compare any revised proposal as a whole: the garments, quantities, size distribution, costs and unresolved details. Ask whether sampling is a separate discussion and which decisions must be settled before bulk quantities can be agreed.

#### A clear quantity question for your next brief (body H2)

Use the text below as a starting point in your own notes. Replace general descriptions with the actual style–color breakdown and keep proposed quantities distinct from agreed terms.

Template title: **Quantity clarification — adapt manually**

```text
For each style and color in my proposed breakdown, please clarify the applicable minimum, whether mixed sizes are permitted, and any size ratio or pack requirements. Please also identify separate material, decoration, label or packaging conditions.

My quantities are a proposal, not an assumption that the project is accepted. Please explain which details need confirmation and whether a different split could be discussed.
```

Before requesting a quotation, add the design references, destination and timing questions that belong with this quantity breakdown. State which details are decided, which are estimates and which need an answer. A clear proposal helps the conversation; it does not itself establish a manufacturing commitment.

### Proposed `body` — end

The proposed body has seven H2 headings, one H3, two tables, one explicit hypothetical callout and one plain-text enquiry template. Its 60/180 example stays only in the article body. `coverImage`, `authorDisplay`, `publishedAt`, `contentUpdatedAt` and `factConfirmedAt` remain unset. `relatedCategories`, `relatedArticles` and `linkToManufacturing` are omitted from this first write; desired internal links are listed below instead of fabricated. No external-source annotation is added or new allowlist entry requested.

## 11. Existing quote Draft — one specified field only

**Basis:** the original cloud Draft was reread in DEV-05H, not inferred from the longer local mock article. It still has 19 stored body blocks, `factReviewStatus=pending`, and the original ID/revision. Its current body, SEO and manual enquiry template are not included in the proposed edit.

Target: `drafts.1d86cc37-7f67-47e0-b29a-3eac5aa0a3ae`.

Observed revision for this proposal: `41ad5fd0-211a-4ea2-89e8-433c2906b8a7`. This is a comparison baseline, not a revision to reuse blindly later.

| Field | Exact proposed change |
|---|---|
| `excerpt` | Remove only the leading technical sentence `DEV-05B integration draft — Studio save verification. ` and keep the following buyer-facing sentence unchanged. |

Proposed complete new `excerpt`:

> Turn your garment idea into a clear first enquiry: describe the styles, split the quantities and separate decisions from open questions.

Do not change `title`, `slug`, `referenceCode`, `seo`, `body` or its `_key` values, `linkToManufacturing=false`, review status, unknown fields or dates. The already truthful “planning guide, not factory terms” callout stays. Do not overwrite this shorter live Draft with the larger local quote article. No substitute article or new test marker is proposed.

At an authorized edit, reread the latest revision and the exact excerpt. If the leading sentence or remaining text differs, compare and report before changing anything. A matching current excerpt with a changed revision still requires a fresh comparison and revision-guarded patch. A value already equal to the proposal is **unchanged**, not an excuse to save it again. Removing only a technical marker does not establish a new public or factual date.

## Field-level readiness and proposed authorization batch

Every entry below is **awaiting Draft-write authorization**. “Ready copy” means authored text, not factory approval, cloud persistence, successful publication validation or frontend rendering. The actual cloud result of this turn is **zero created, zero edited; the existing quote Draft was only read and remains unchanged**.

| Object / proposed Draft ID | Ready copy / structural fields proposed for this batch | Facts/status fields withheld | Images / references waiting |
|---|---|---|---|
| `drafts.siteSettings` | `brandName`; both `channelStatus` booleans false | Factory/business/contact fields, `defaultMoq`, `factConfirmedAt` | `logo`, `defaultOgImage`, `featuredCategories` |
| `drafts.page.home` | `pageKey`, `title`, `intro`, `seo`, `faqItems`; template type/key, `eyebrow`, six `sections`, `manufacturingSummary`, `processSteps` | `capabilities`, `factorySummary`, dates; optional `titleLineHints` omitted | `heroImage`, optional `factoryImage` |
| `drafts.page.manufacturing` | `pageKey`, `title`, `intro`, `seo`, `faqItems`; template type/key, `eyebrow`, `contextNote`, `guideTitle`, seven `sections`, `options`, `moqFactors`, `preparation`, `preparationLead`, `preparationNote`, `sampling`, `productionSteps` | Dates and actual shared MOQ/service confirmation | `relatedLinks` |
| `drafts.page.factory` | `pageKey`, `title`, `intro`, `seo`; template type/key, `eyebrow`, `contextNote`, four `sections`, `overviewNote`, `qualityDiscussion` | `overview`, `arrangements`, factual/operating claims and dates | Optional `heroImage`, `gallery`, `credentials`; required `relatedLinks` |
| `drafts.page.contact` | `pageKey`, `title`, `intro`, `seo`; template type/key, `eyebrow`, `contextNote`, two `sections`, `preparation`, `preparationNote` | Dates; accounts remain only in settings and withheld | `relatedLinks` |
| `drafts.page.blogIndex` | `pageKey`, `title`, `intro`, `seo`; template type/key, `eyebrow`, `columnNote` | Dates; no card/author/publication fields invented | No page image or article-reference array required |
| `drafts.page.privacy` | `pageKey`, `title`, `intro`, `seo`; template type/key, `eyebrow`, supplied `body`, `legalReviewStatus=pending`, `policyStatus=draft_not_in_effect` | Dates; `legalReviewedAt`, `effectiveAt`, `legalEntity`, `privacyContact`, `providers`, `retention` | No image/reference required |
| `drafts.category.t-shirts` | `name`, `slug`, `categoryCode`, `referenceCode`, `title`, `intro`, `seo`, `customizationNotes`, `samplingNotes`, `faqItems` | `capabilityRows`, `moqMode`, `moqOverride`, dates | `heroImage`, real `samples`, `evidenceImages`, optional `relatedArticles` |
| `drafts.category.hoodies` | Same field names, independent Hoodie wording | Same withheld fields; no copied capability assertions | Same requirements, independently verified samples/images |
| `drafts.article.moq-per-style-per-color` | `title`, `slug`, `referenceCode`, `excerpt`, `seo`, supplied `body`, `factReviewStatus=pending` | Author and all public/content/fact dates | `coverImage`; optional related arrays and manufacturing link omitted |
| Original quote Draft ID above | Only the specified `excerpt` patch | Every other field remains untouched | Existing missing fields stay missing; no reference changes |

The first ten rows are **proposed new logical records, not ten unconditional creates**. DEV-05H's limited read found no matches for them, but a later write must compare fresh selectors, canonical/proposed IDs, types and draft/published versions. Stop and report unexpected keys, duplicates or permission uncertainty; do not widen enumeration or treat a newly found record as permission to overwrite it.

### Reference tasks — deliberately not entered in this batch

| Owning field / location | Intended target after readiness and authorization |
|---|---|
| `siteSettings.featuredCategories` | The verified T-shirt and Hoodie documents, in that order |
| Manufacturing `relatedLinks` | Factory; Contact |
| Factory `relatedLinks` | Manufacturing `prepare`; Contact |
| Contact `relatedLinks` | Manufacturing `prepare` |
| MOQ article optional editorial links | Manufacturing `moq`; existing quote guide; Contact |
| Category optional related reading | Existing quote guide and MOQ guide when appropriate, approved and compatible with the article source |

No `_ref` is guessed from the proposed names. No target is published to make a link save, no weak reference is added, and no draft-reference semantics are assumed from a newer Studio example. Because this batch omits unready reference fields entirely, it does not require widening the installed draft-preview or published-reader contract. Reference completion is a later explicitly scoped task.

### Minimal authorization request — not a record of approval

Approve, only in `iajvl7ka/production`, creation of whichever of the first ten logical records above are still missing as **unpublished Drafts**, using only their listed ready-copy/structural/status fields, plus the **excerpt-only** revision-guarded edit to the original quote Draft. Leave all withheld fields unset and all existing unknown content intact. Authorization would not include media, reference completion, publishing/unpublishing, deletion, messages, schema/Studio/site deployment, environment changes, policy activation or preview expansion. No cloud save has been executed under this proposal.
