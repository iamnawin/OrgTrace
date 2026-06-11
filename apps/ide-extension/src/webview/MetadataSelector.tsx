import { useEffect, useMemo, useState } from 'react';
import type { ComponentRef, MetadataType } from '@orgtrace/core';
import { displayFor } from '../commands/componentPicks';
import { FilePathButton } from './FilePathButton';
import { postWebviewMessage } from './webviewMessaging';

interface MetadataSelectorProps {
  components: ComponentRef[];
}

export interface TypeGroup {
  type: MetadataType;
  label: string;
  components: ComponentRef[];
}

export interface MetadataSelectorState {
  activeType: MetadataType | undefined;
  selectedKeys: Set<string>;
}

export function keyFor(component: ComponentRef): string {
  return `${component.type}:${component.apiName}`;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function applyTypeSelection(
  state: MetadataSelectorState,
  group: TypeGroup,
  selected: boolean,
): MetadataSelectorState {
  const selectedKeys = new Set(state.selectedKeys);

  for (const component of group.components) {
    const key = keyFor(component);
    if (selected) selectedKeys.add(key);
    else selectedKeys.delete(key);
  }

  return {
    activeType: group.type,
    selectedKeys,
  };
}

export function MetadataSelector({ components }: MetadataSelectorProps): JSX.Element {
  const groups = useMemo<TypeGroup[]>(() => {
    const map = new Map<MetadataType, ComponentRef[]>();
    for (const component of components) {
      const existing = map.get(component.type) ?? [];
      existing.push(component);
      map.set(component.type, existing);
    }

    return [...map.entries()]
      .map(([type, refs]) => ({
        type,
        label: displayFor(type).label,
        components: refs.sort((a, b) => (a.label ?? a.apiName).localeCompare(b.label ?? b.apiName)),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [components]);

  const [activeType, setActiveType] = useState<MetadataType | undefined>(groups[0]?.type);
  const [typeQuery, setTypeQuery] = useState('');
  const [componentQuery, setComponentQuery] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!groups.some((group) => group.type === activeType)) {
      setActiveType(groups[0]?.type);
    }
  }, [activeType, groups]);

  const selectedComponents = useMemo(
    () => components.filter((component) => selectedKeys.has(keyFor(component))),
    [components, selectedKeys],
  );
  const activeGroup = groups.find((group) => group.type === activeType) ?? groups[0];
  const filteredGroups = groups.filter((group) =>
    normalize(group.label).includes(normalize(typeQuery)),
  );
  const filteredComponents = (activeGroup?.components ?? []).filter((component) => {
    const label = component.label ?? component.apiName;
    const query = normalize(componentQuery);
    return (
      normalize(label).includes(query) ||
      normalize(component.filePath ?? '').includes(query)
    );
  });

  const setTypeSelection = (group: TypeGroup, selected: boolean): void => {
    setActiveType(group.type);
    setSelectedKeys((previous) => {
      return applyTypeSelection(
        { activeType: group.type, selectedKeys: previous },
        group,
        selected,
      ).selectedKeys;
    });
  };

  const toggleComponent = (component: ComponentRef): void => {
    setSelectedKeys((previous) => {
      const next = new Set(previous);
      const key = keyFor(component);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <section className="metadata-selector">
      <div className="selector-toolbar">
        <div>
          <p className="eyebrow">OrgTrace</p>
          <h1>Metadata impact selector</h1>
        </div>
        <button
          className="primary-action"
          type="button"
          disabled={selectedComponents.length === 0}
          onClick={() => postWebviewMessage({ type: 'analyzeMany', targets: selectedComponents })}
        >
          Analyze {selectedComponents.length || ''}
        </button>
      </div>

      <div className="selector-grid">
        <section className="selector-pane">
          <header className="pane-header">
            <h2>Metadata Types</h2>
            <div className="pane-actions">
              <button type="button" onClick={() => setSelectedKeys(new Set(components.map(keyFor)))}>
                Select All
              </button>
              <button type="button" onClick={() => setSelectedKeys(new Set())}>
                Clear All
              </button>
            </div>
          </header>
          <input
            aria-label="Filter metadata types"
            className="selector-search"
            placeholder="Filter metadata types..."
            value={typeQuery}
            onChange={(event) => setTypeQuery(event.target.value)}
          />
          <div className="selector-list">
            {filteredGroups.map((group) => {
              const selectedCount = group.components.filter((component) => selectedKeys.has(keyFor(component))).length;
              return (
                <button
                  key={group.type}
                  className={`type-row${group.type === activeGroup?.type ? ' active' : ''}${selectedCount > 0 ? ' selected' : ''}`}
                  type="button"
                  onClick={() => setActiveType(group.type)}
                >
                  <input
                    type="checkbox"
                    checked={selectedCount === group.components.length}
                    ref={(input) => {
                      if (input) input.indeterminate = selectedCount > 0 && selectedCount < group.components.length;
                    }}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => setTypeSelection(group, event.target.checked)}
                  />
                  <span>{group.label}</span>
                  <span className="row-count">{group.components.length}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="selector-pane">
          <header className="pane-header">
            <h2>{activeGroup?.label ?? 'Components'}</h2>
            <div className="pane-actions">
              <button
                type="button"
                disabled={!activeGroup}
                onClick={() => activeGroup ? setTypeSelection(activeGroup, true) : undefined}
              >
                Select All
              </button>
              <button
                type="button"
                disabled={!activeGroup}
                onClick={() => activeGroup ? setTypeSelection(activeGroup, false) : undefined}
              >
                Clear All
              </button>
            </div>
          </header>
          <input
            aria-label="Filter components"
            className="selector-search"
            placeholder={`Filter ${activeGroup?.label ?? 'components'}...`}
            value={componentQuery}
            onChange={(event) => setComponentQuery(event.target.value)}
          />
          <div className="selector-list">
            {filteredComponents.map((component) => (
              <label
                key={keyFor(component)}
                className={`component-row${selectedKeys.has(keyFor(component)) ? ' selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedKeys.has(keyFor(component))}
                  onChange={() => toggleComponent(component)}
                />
                <span>
                  <strong>{component.label ?? component.apiName}</strong>
                  {component.filePath ? (
                    <small>
                      <FilePathButton filePath={component.filePath} />
                    </small>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
