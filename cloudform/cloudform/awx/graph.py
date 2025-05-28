# flake8: noqa E203
import json


def new_play(line):
    desc = line[line.index("[") + 1 : line.index("]")]
    return {"name": desc, "tasks": []}


def validate_play(play):
    assert (
        play is not None and "recap" not in play
    ), "New NEW section should follow after PLAY RECAP section"


def validate_task(task):
    assert task is not None and "name" in task, "Task at least should contain its name"


def new_task(line):
    desc = line[line.index("[") + 1 : line.index("]")]
    if ":" in desc:
        role, name = list(map(lambda _: _.strip(), desc.split(":")))
    else:
        role, name = ("", desc)

    return {"role": role, "name": name, "results": []}


def is_result_status(headline):
    return headline in ("ok", "changed")


def new_result(content):
    pos = content.index(":")
    status, content = content[:pos], content[pos + 1 :]

    rpos = pos + 1
    host = ""
    try:
        lpos, rpos = content.index("[") + 1, content.index("]")
        host = content[lpos:rpos]
    except ValueError:
        pass

    content = content[rpos + 1 :]

    return {"status": status, "host": host, "content": content}


def headline_cut(line):
    if line.startswith("["):
        return line[1 : line.index("]:")]
    if ":" in line[:10]:
        return line[: line.index(":")]
    return ""


def gen_task_result(content):
    result_content = ""
    keep = True
    for line in content.splitlines():
        headline = headline_cut(line)
        if headline:
            keep = is_result_status(headline)
            if result_content:
                yield new_result(result_content)
            result_content = ""

        if keep:
            result_content += line

    if result_content:
        yield new_result(result_content)


def populate_task(task, content):
    results = list(map(make_content_json, gen_task_result(content)))
    task["results"].extend(results)


def make_content_json(result):
    content = result.get("content")
    HASH_OPR = " => "
    while HASH_OPR in content:
        pos = content.rindex(HASH_OPR)
        content = content[pos + len(HASH_OPR) :]
    try:
        obj = json.loads(content)
        result["content"] = obj
    except Exception:
        result["content"] = content
    return result


def add_task(play, task, item):
    populate_task(task, item)
    validate_task(task)
    play["tasks"].append(task)


def new_recap(recap_content):
    host, results = recap_content.split(":")

    results = results.strip().split()
    results = map(lambda s: int(s.split("=")[1]), results)

    ok, changed, unreachable, failed, skipped, rescued, ignored = results

    return {
        "host": "localhost",
        "ok": ok,
        "changed": changed,
        "unreachable": unreachable,
        "failed": failed,
        "skipped": skipped,
        "rescued": rescued,
        "ignored": ignored,
    }


def populate_recap(play, item):
    play["recap"] = new_recap(item)


def new_output():
    return {"plays": []}


def job_output_graph(job_output):
    output = new_output()
    play = None
    task = None
    item = ""

    for line in job_output.splitlines():

        if line.startswith("PLAY RECAP"):
            if task is not None:
                add_task(play, task, item)
            task = None
            item = ""

        elif line.startswith("PLAY") and not line.startswith("PLAYBOOK"):
            if play is not None:
                validate_play(play)
                output["plays"].append(play)

            play = new_play(line)
            task = None
            item = ""

        elif line.startswith("TASK"):
            if task is not None:
                add_task(play, task, item)
            task = new_task(line)
            item = ""

        else:
            item += line + "\n"

    if play is not None and task is None and len(item) > 0:
        populate_recap(play, item)
        output["plays"].append(play)

    return output
