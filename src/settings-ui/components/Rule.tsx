import { Accessor, For } from "solid-js";

import { Cog } from "./Cog";
import { DateFormatDescription } from "./DateFormatDescription";
import { PlaceholdersDescription } from "./PlaceholdersDescription";
import { useSettingsContext } from "./context/SettingsProvider";
import { ButtonSetting } from "./setting/ButtonSetting";
import { SettingGroup } from "./setting/SettingGroup";
import { TextAreaSetting } from "./setting/TextAreaSetting";
import { TextSetting } from "./setting/TextSetting";

import { placeholders } from "../../Constants";
import { Rule as RuleType } from "../../Settings";
import { PlaceholderService } from "../../services/PlaceholderService";

interface RuleProps {
  placeholderResolver: PlaceholderService;
  index: Accessor<number>;
}

function dedupe(value: string) {
  return [...new Set(value.split(""))].join("");
}

export function Rule(props: RuleProps) {
  const [settings, setSettings] = useSettingsContext();
  const ruleSettings = () => settings.rules[props.index()];
  const dateFormat = () => ruleSettings().dateFormat;
  const archivePath = () => ruleSettings().defaultArchiveFileName;
  const dedupedStatuses = () => dedupe(ruleSettings().statuses);
  const pathPatterns = () => ruleSettings().pathPatterns;

  const updateRule = (newValues: Partial<RuleType>) =>
    setSettings("rules", (rule, i) => i === props.index(), newValues);
  const deleteRule = () =>
    setSettings("rules", (prev) => prev.filter((rule, i) => i !== props.index()));

  const renderStatusExamples = () => (
    <>
      These tasks will be matched:
      <ul class="archiver-status-examples">
        <For each={dedupedStatuses().split("")}>
          {(status) => (
            <li>
              <code>- [{status}] task</code>
            </li>
          )}
        </For>
      </ul>
    </>
  );

  const statusesDescription = () =>
    dedupedStatuses().length === 0
      ? "Add some statuses, like '>', '-', '?'. Right now all the statuses will match"
      : renderStatusExamples();

  return (
    <SettingGroup
      header={`Rule ${props.index() + 1}`}
      collapsible
      initialFolded={false}
    >
      <SettingGroup header="When">
        <TextSetting
          onInput={(event) => {
            const dedupedValue = dedupe(event.currentTarget.value);

            if (dedupedValue === dedupedStatuses()) {
              // eslint-disable-next-line no-param-reassign
              event.currentTarget.value = dedupedValue;
            } else {
              updateRule({ statuses: dedupedValue });
            }
          }}
          name="A task has one of statuses"
          description={statusesDescription()}
          placeholder="-?>"
          value={dedupedStatuses()}
        />

        <TextAreaSetting
          onInput={({ currentTarget: { value } }) => {
            updateRule({ pathPatterns: value });
          }}
          name="And the file path matches one of patterns"
          value={pathPatterns() || ""}
          description="Add a pattern per line. No patterns means all files will match"
          placeholder="path/to/project\n.*tasks"
          inputClass="archiver-rule-paths"
          class="wide-input"
        />

        <TextAreaSetting
          onInput={({ currentTarget: { value } }) => {
            updateRule({ textPatterns: value });
          }}
          name="And the task text matches one of patterns"
          value={ruleSettings().textPatterns || ""}
          description="Add a pattern per line. No patterns means all tasks will match"
          placeholder="every .+"
          inputClass="archiver-rule-paths"
          class="wide-input"
        />
      </SettingGroup>

      <SettingGroup>
        <TextSetting
          onInput={({ currentTarget: { value } }) =>
            updateRule({ defaultArchiveFileName: value })
          }
          name="Then move it to file"
          value={archivePath()}
          placeholder={`path/to/${placeholders.ACTIVE_FILE_NEW} archive`}
          class="wide-input"
        />
        <PlaceholdersDescription placeholderResolver={props.placeholderResolver} />
        <SettingGroup headerIcon={<Cog />} header="Configure variables" collapsible>
          <TextSetting
            onInput={({ currentTarget: { value } }) =>
              updateRule({ dateFormat: value })
            }
            name="Date format"
            description={<DateFormatDescription dateFormat={dateFormat()} />}
            value={dateFormat()}
          />
        </SettingGroup>
      </SettingGroup>
      <ButtonSetting onClick={deleteRule} buttonText="Delete rule" />
    </SettingGroup>
  );
}
