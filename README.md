This plugin is a toolbox for working with completed tasks in your markdown files. It brings some
of [org-mode's](https://orgmode.org/) features to Obsidian. It provides features such as archiving, deleting and sorting
tasks and document sections.

## Table of contents

- [Commands <a id="commands"></a>](#commands--a-id--commands----a-)
    * [Archive tasks in this file](#archive-tasks-in-this-file)
    * [Delete tasks in this file](#delete-tasks-in-this-file)
    * [Archive heading under cursor](#archive-heading-under-cursor)
    * [Sort tasks in list under cursor](#sort-tasks-in-list-under-cursor)
- [Configuration](#configuration)
    * [Date tree](#date-tree)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [Acknowledgements](#acknowledgements)

## Commands <a id="commands"></a>

### Archive tasks in this file

Here is what it looks like:

```md
- [ ] This one I haven't done yet
- [x] Water the dog
    - Some task details
- [x] Feed the plants
```

Turns into:

```md
- [ ] This one I haven't done yet

# Archived

- [x] Water the dog
    - Some task details
- [x] Feed the plants
```

Or, with date tree enabled:

```md
- [ ] This one I haven't done yet

# Archived

- [[2021-09-W-38]]
    - [[2021-09-16]]
        - [x] Water the dog
            - Some task details
        - [x] Feed the plants
```

### Delete tasks in this file

This one is the same as 'Archive tasks in this file', except that the tasks get discarded.

### Archive heading under cursor

Grab the whole section under the heading under cursor, including all the child sections and move it to the archive.

This:

```markdown
Some top-level text

# H1 heading

Some text

## H2 heading

More text
```

Turns into:

```markdown
Some top-level text

# Archived

## H1 heading

Some text

### H2 heading

More text
```

### Sort tasks in list under cursor

Grab the whole list under cursor and **recursively** reorder all the items based on completeness:

1. Plain list items first
2. Then, incomplete tasks
3. And finally, completed tasks

This list:

```markdown
- [x] Task
- Item
- [ ] Incomplete
    - [x] Task
    - Item More notes
    - [ ] Incomplete
- Item 2
- [ ] Incomplete 2
    - [x] Task
    - Item
    - [x] Task 2
```

Turns into:

```markdown
- Item
- Item 2
- [ ] Incomplete
    - Item More notes
    - [ ] Incomplete
    - [x] Task
- [ ] Incomplete 2
    - Item
    - [x] Task
    - [x] Task 2
- [x] Task
```

## Configuration

The plugin lets you configure the following:

- what text makes a heading an archive;
- whether to add newlines around headings when moving stuff around;
- moving tasks to the current file or to a separate file.

### Date tree

Each checked date tree option (weeks, days) will create an additional level in the archive hierarchy with a link to the
corresponding periodic note.

## Usage

Open the command palette and run one of the archiver [commands](#commands).

## Roadmap

- [x] Move completed tasks to a separate archive file
- [x] Delete completed tasks
- [x] Archive any document section
- [x] Archive sublists per list item
- [ ] Per-file configuration through front-matter
- [ ] More options for the date tree
    - [x] Days
    - [ ] Months
    - [ ] Years
- [ ] Multiple archive subheadings per file

## Acknowledgements

This plugin is a simple & incomplete (for now) implementation of the archiving features
of [org-mode](https://orgmode.org/).

Also, I relied on the code from these excellent plugins:

- [obsidian-kanban](https://github.com/mgmeyers/obsidian-kanban);
- [obsidian-outliner](https://github.com/vslinko/obsidian-outliner).
