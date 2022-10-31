var api = 'https://api.github.com/repos/moonlight-stream/moonlight-qt/releases';

function start() {
    getReleases();

    handleCompare();
}

function getReleases() {
    fetch(api)
        .then((response) => response.json())
        .then(displayReleases);
}

function displayReleases(releases) {
    var listReleases = document.querySelector('#release');
    var compareReleases = document.querySelector('#compare-release');
    var htmls = releases.map((release) => {
        return `
            <option>${release.tag_name}</option>
        `
    });
    listReleases.innerHTML = htmls;
    compareReleases.innerHTML = htmls;
}

function displayCompares(commits) {
    console.log(commits);
    var compareList = document.querySelector('#compare');
    let id = 0;
    var head = `<tr>
            <th>STT</th>
            <th>message</th>
            <th>commiter</th>
        </tr>`
    var htmls = [];
    htmls.push(head);
    htmls.push(commits.map((commit) => {
        return `
                <tr>
                    <td>${++id}</td>
                    <td>${commit.commit.message}</td>
                    <td>${commit.commit.committer.name}</td>
                </tr>
            `
    }));
    compareList.innerHTML = htmls.join('');
}


function getCompares(compareApi) {
    console.log(compareApi);
    fetch(compareApi)
        .then(response => response.json())
        .then(result => {
            console.log(result);
            console.log(result.base_commit);
            displayCompares(result.commits)
        });
    //.then(displayCompares);
}

function handleCompare() {
    var btn = document.querySelector('#btn');

    btn.onclick = function() {
        var release1 = document.querySelector('#release').value;
        var release2 = document.querySelector('#compare-release').value;
        if (release1 != release2) {
            if (release1 > release2) {
                let tmp = release1;
                release1 = release2;
                release2 = tmp;
            }
            getCompares('https://api.github.com/repos/moonlight-stream/moonlight-qt/compare/' + release1 + '...' + release2);
        }

    }
}


start();