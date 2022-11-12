var linkApi;
document.querySelector(".btn").onclick = () => {
    handle(document.querySelector(".input-link").value);
}

var obj = {
    method: 'GET',

    headers: {
        // 'Authorization': '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',
        Authorization: 'token ' + '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',
        'Accept': 'application/json',
        'Content-Type': 'application/json',

    }
};

async function handle(linkHtml) {
    linkApi = 'https://api.github.com/repos/' + linkHtml.split('github.com/')[1];
    var releases = [];
    var isFinal = false;
    for (let i = 1; i <= 10; i++) {
        if (isFinal) {
            break;
        }
        await fetch(`${linkApi}/releases?page=${i}`, obj)
            .then(res => res.json())
            .then(objArray => objArray.map(obj => {
                return obj.tag_name;
            }))
            .then(arr => {
                if (arr.length == 0 || arr.length < 30) {
                    isFinal = true;
                }
                console.log(arr);
                releases.push(...arr);
            })
            .catch(err => console.log(err));
    }
    display(releases);
}


function display(releases) {
    var releaseList = [];
    for (let i = 0; i < releases.length - 1; i++) {
        console.log(linkApi + '/compare/' + releases[i + 1] + '...' + releases[i]);
        releaseList.push({
            compare: linkApi + '/compare/' + releases[i + 1] + '...' + releases[i],
            version: releases[i]
        });
    }
    Promise.all(releaseList.map(async release => {
            var htmls = [`<div border = "1">${release.version}<table class="table table-striped table-dark">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">message</th>
                <th scope="col">name</th>
                <th scope="col">date</th>
              </tr>
            </thead>
            <tbody>`];

            var arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            await htmls.push(await Promise.all(arr.map(idx => {
                console.log(`${release.compare}?page=${idx}`);
                return fetch(`${release.compare}?page=${idx}`, obj)
                    .then(res => res.json())
                    .then(content => {
                        try {
                            console.log(content);

                            return content.commits.map(commit => {
                                return `<tr>
                                        <th scope="row">1</th>
                                        <td>${commit.commit.message.trim()}</td>
                                        <td>${commit.commit.committer.name.trim()}</td>
                                        <td>${commit.commit.committer.date.trim()}</td>
                                        </tr>`;
                            }).join('');
                        } catch (e) {
                            console.log(e);
                            return '';
                        }
                    })
                    .catch(e => {
                        console.log(e);
                        return '';
                    })
            })));
            htmls.push(`</tbody></table></div>`);
            return htmls;
        }))
        .then(arr => {
            console.log(arr.join(''))
            document.querySelector('#releases').innerHTML = arr.join('');
            document.querySelectorAll('#releases > div > table').forEach((table, idx) => {
                table.onclick = () => {
                    let body = document.querySelector(`#releases div:nth-child(${idx + 1}) table tbody`)
                    if (body.style.display === 'none' || body.style.display == '') {
                        body.style.display = 'table-row-group';
                    } else {
                        body.style.display = 'none';
                    }
                }
            });
        })
        .catch((htmls) => {
            console.log(htmls.join(''))
            document.querySelector('#releases').innerHTML = htmls.join('');
            document.querySelectorAll('#releases > div > table').forEach((table, idx) => {
                table.onclick = () => {
                    let body = document.querySelector(`#releases div:nth-child(${idx + 1}) table tbody`)
                    if (body.style.display === 'none' || body.style.display == '') {
                        body.style.display = 'table-row-group';
                    } else {
                        body.style.display = 'none';
                    }
                }
            });
        })
};