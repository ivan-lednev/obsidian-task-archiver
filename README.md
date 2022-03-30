The plugin adds commands that either delete or move completed tasks in the active file either under a pre-configured heading in the same file or to a separate file.

This is handy if you like organizing your tasks in an outline: completed tasks don't clutter up your workspace, but you can still go back to them when needed.

## Here is what it looks like

```md
- [ ] This one I haven't done yet
- [x] Water the dog
    - Some task details
- [x] Feed the plants
```
Turns into
```md
- [ ] This one I haven't done yet

# Archived

- [[2021-09-W-38]]
    - [[2021-09-16]]
        - [x] Water the dog
            - Some task details
        - [x] Feed the plants

```

## Configuration

The plugin lets you configure the following:
- what text makes a heading an archive;
- whether to add newlines around headings when moving stuff around;
- moving tasks to the current file or to a separate file.

### Date tree

Each checked date tree option (weeks, days) will create an additional level in the archive hierarchy with a link to the corresponding periodic note.

## Usage

Open the command palette and run one of the archiver commands:
- `Archive tasks in this file`
- `Delete tasks in this file`

## Roadmap

- [x] Move completed tasks to a separate archive file
- [x] Delete completed tasks
- [ ] Per-file configuration through front-matter
- [ ] More options for the date tree
  - [x] Days
  - [ ] Months
  - [ ] Years
- [ ] Multiple archive subheadings per file
- [ ] Archive sublists per list item
- [ ] Archive any document section

## Acknowledgements

This plugin is a simple & incomplete (for now) implementation of the archiving features of [org-mode](https://orgmode.org/).

Also, I relied on the code from these excellent plugins:
- [obsidian-kanban](https://github.com/mgmeyers/obsidian-kanban);
- [obsidian-outliner](https://github.com/vslinko/obsidian-outliner).
