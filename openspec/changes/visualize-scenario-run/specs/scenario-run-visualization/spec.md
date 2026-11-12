## Purpose

Let a user review a scenario run as an evidence-grounded narrative of consequential effects, and provide feedback to the parent conversation without obscuring uncertainty.

## ADDED Requirements

### Requirement: Evidence handoff preserves review context
The parent SHALL provide the visualization editor a sanitized evidence bundle identifying the workflow goal, scenario, run and versions, actors, workspace sessions, candidate occurrences, source evidence, artifacts, observation coverage and gaps, data origin, and logical parent feedback target and allowed intents. Execution method SHALL be opaque to visualization. Unknown session level SHALL NOT be treated as top-level.

#### Scenario: Incomplete evidence
- **WHEN** source coverage or session level is unknown
- **THEN** the editor retains the gap and does not invent coverage or a top-level session.

### Requirement: Timeline selects relevant consequential events
The editor SHALL select starts and terminations of top-level workspace sessions, world-affecting workspace-agent actions, and direct or nth-order external-system actions relevant to the stated workflow goal. Internal reasoning, reads, tool plumbing and child lifecycle SHALL be supporting details only. The story SHALL use complete sentences, identify actors and service boundaries, show relevant artifacts inline and make technical details expandable.

#### Scenario: Relevant effect triggers a second session
- **WHEN** an agent action is supported as causing a goal-relevant second-order external event that starts a second top-level session
- **THEN** the timeline includes both sessions and the supported chain, excluding unrelated effects and child plumbing.

#### Scenario: Relevant omission among noise
- **WHEN** the evidence includes a goal-relevant downstream effect among unrelated changes and internal activity
- **THEN** the editor includes the relevant effect and excludes the noise from the main timeline.

### Requirement: Independently verify real-world claims
A distinct fact-check agent SHALL independently make authorized read-only source calls for proposed claims of real-world effects; it SHALL NOT repeat writes or trigger the workflow. It SHALL record claim-level findings, source identifiers, observation times and gaps, and distinguish observed, synthetic and mixed data. The editor SHALL correct or qualify claims and obtain another review of the final factual revision before rendering. Unavailable or conflicting evidence SHALL be visible, not silently resolved.

#### Scenario: Editorial correction
- **WHEN** independent verification disproves or qualifies a proposed claim
- **THEN** the editor revises the claim and obtains a new review before rendering.

#### Scenario: Contradiction or inaccessible source
- **WHEN** independent evidence conflicts with the bundle or a source read is unavailable
- **THEN** the output explicitly preserves the conflict or verification gap rather than claiming confirmation.

#### Scenario: Present state without historical causation
- **WHEN** an independent read only establishes that a record exists now
- **THEN** the story does not claim the run created it or establish when it did so without historical support.

### Requirement: Represent outcome and uncertainty truthfully
The story SHALL distinguish attempts from completed effects, retain confirmed effects alongside failures, and avoid unsupported timestamps, ordering, causation, and overall success. Inferences SHALL be identified as such and supported artifacts and evidence SHALL remain attributable.

#### Scenario: Attempt versus effect
- **WHEN** the evidence only confirms acceptance of a request
- **THEN** the narrative does not claim delivery or completed change.

#### Scenario: Partial failure and ambiguous order
- **WHEN** some effects succeed and other steps fail or their order is unknown
- **THEN** the story reports each supported outcome and leaves the unknown order or cause explicit.

### Requirement: Validate and safely render the checked snapshot
A deterministic packaged renderer SHALL accept a sanitized render snapshot, validate its schema and references, and return either actionable structured errors or a successful HTML artifact path. It SHALL escape untrusted source text and safely handle URLs and embedded content; secrets SHALL be removed before snapshots rather than hidden behind a control. It SHALL NOT collect evidence, fact-check, author the narrative or perform feedback actions. Factual changes during repair SHALL require a renewed fact-check, and final rendered content SHALL match the fact-checked revision.

#### Scenario: Invalid snapshot is repaired
- **WHEN** validation rejects a snapshot
- **THEN** the editor uses the structured errors to repair and resubmit it, rechecking any factual changes.

#### Scenario: Render failure
- **WHEN** rendering cannot succeed within bounded retries
- **THEN** the parent receives an honest failure and references to useful safe output, without a claimed successful artifact.

### Requirement: Present artifact and route intent honestly
On successful rendering, the editor SHALL attempt presentation using a supported host mechanism, return the artifact reference, verification summary and gaps to the parent, and be able to close without owning later feedback. A user action SHALL be an intent with snapshot, run, scenario and where applicable event identifiers, not an assertion of an executed action. Automatic routing SHALL be offered only through a verified parent-bound host transport that survives editor closure; otherwise the artifact SHALL offer explicit copy-to-chat feedback and SHALL NOT claim automatic delivery. Terminal Claude Code SHALL use browser presentation and either such a verified bridge or the copy fallback.

#### Scenario: Interaction after editor closure
- **WHEN** the user interacts after the editor closes and a host-verified parent-bound bridge is available
- **THEN** the intent reaches the original parent with the correct identifiers without executing the requested operation.

#### Scenario: No verified bridge
- **WHEN** automatic transport is absent, including in a terminal browser
- **THEN** the user can copy the intent and paste it into the parent conversation, and the artifact does not claim delivery.

#### Scenario: Presentation fails
- **WHEN** the host cannot open a valid artifact
- **THEN** the parent receives the artifact reference and presentation failure rather than a false success claim.

### Requirement: Evaluate the visualization boundary
Fixture-based workflow evaluations SHALL cover simple success, relevant downstream session, editorial correction, renderer repair, post-closure interaction with host-specific automatic and manual variants, attempt versus effect, contradictory verification, unavailable verification, current state versus causation, omission and noise, partial failure, ambiguous ordering, and render or presentation failure. Independent verification SHALL be checked across applicable cases using separate fixture source calls. Synthetic fixtures SHALL NOT be presented as real verification, and real-host tests SHALL separately establish host presentation and any automatic transport.

#### Scenario: Simple successful workflow
- **WHEN** a synthetic run includes a session start, independently confirmed world action with artifact, and termination
- **THEN** the evaluation checks the complete narrative and inline artifact and labels the result synthetic.
