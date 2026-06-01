param(
    [string]$ApiBaseUrl = "http://localhost:4300/api",
    [string]$DemoToken = $env:DEMO_AUTH_TOKEN
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$apiRoot = $ApiBaseUrl.TrimEnd("/")

# This is a neutral example dataset, not a verified export from the Lovable preview.
# Evidence is intentionally empty; source-backed evidence should be added only from a real export.
$lauderAlbum = [ordered]@{
    Template = [ordered]@{
        Title = "A Lauder története és környéke"
        Subject = "Helytörténet / társadalomismeret / vizuális kultúra"
        Grade = "7-10. évfolyam"
        DurationType = "het"
        DrivingQuestion = "Hogyan mesélhető el a Lauder története és környéke úgy, hogy a mai diákok számára is személyes és kutatható legyen?"
        FinalProduct = "Közösségi digitális vagy nyomtatható album idővonallal, térképpel, interjúrészletekkel és diákok által készített albumlapokkal."
        Audience = "Lauder diákok, tanárok, szülők és az iskola iránt érdeklődő látogatók."
        Dispositions = @(
            "Kíváncsiság",
            "Képzelőerő",
            "Együttműködés",
            "Kitartás",
            "Fegyelem"
        )
        WeekTitles = @(
            "Emlékek és kérdések",
            "Térképek, helyek, környék",
            "Források, interjúk, idővonal",
            "Nézőpontok és történetek",
            "Albumlapok prototípusa",
            "Kiállítás és reflexió"
        )
    }
    Stickers = @(
        [ordered]@{
            Title = "Lauder-nyomozó kérdésfal"
            Week = 1
            SortOrder = 1
            Phase = "kerdezes"
            ShortDescription = "Közös kérdésgyűjtés arról, mit szeretnénk megtudni a Lauder történetéről és környékéről."
            StudentInstruction = "Gyűjtsetek legalább öt kérdést: mi érdekel benneteket az iskola múltjából, épületéből, közösségéből vagy környékéből? Válasszatok ki egyet, amelyet a csapatotok kutatni fog."
            TeacherSteps = @(
                "Indíts rövid beszélgetéssel: mit tudunk biztosan, és mi csak feltételezés?",
                "Különítsd el a ténykérdéseket, értelmező kérdéseket és személyes emlékekre irányuló kérdéseket.",
                "Segíts a csapatoknak egy kutatható, nyílt kérdést választani.",
                "Zárd az órát közös kérdésfallal és csapatonként egy vállalással."
            )
            StudentChoice = "A csapat választhat történeti, térbeli, közösségi vagy személyes emlékezetre fókuszáló kérdést."
            ExpectedProduct = "Csapatonként egy kutatókérdés, három alkérdés és egy első forrásötlet."
            EvidenceTypeLabel = "Kérdésfal + csapatkutatási lap"
            ReflectionPrompt = "Melyik kérdésetek lett nyitottabb vagy pontosabb a közös beszélgetés után?"
            BPlan = "Ha kevés előzetes tudás van, adj 6-8 képet vagy rövid forrásrészletet inspirációként."
            LowResource = "Papírcetlik, tábla és filc elegendő; digitális eszköz nem szükséges."
        },
        [ordered]@{
            Title = "Környéktérkép régen és ma"
            Week = 2
            SortOrder = 1
            Phase = "kerdezes"
            ShortDescription = "Az iskola környékének feltérképezése megfigyeléssel, útvonalakkal és változásnyomokkal."
            StudentInstruction = "Jelöljetek be egy térképen 3-5 olyan pontot az iskola környékén, amely szerintetek fontos a Lauder történetéhez vagy mai életéhez. Írjátok mellé, miért számít."
            TeacherSteps = @(
                "Mutass példát arra, hogy egy térképpont lehet fizikai hely, útvonal, találkozási pont vagy emlékhely.",
                "Kérd a csapatokat, hogy minden pont mellé írjanak bizonyítékot vagy kérdést.",
                "Beszéljétek meg, mely pontok kapcsolódnak történethez, és melyek csak háttérként fontosak.",
                "A végén csapatonként válasszanak egy fókuszpontot mélyebb feldolgozásra."
            )
            StudentChoice = "A csapat dönthet, hogy épületre, útvonalra, közösségi helyre vagy változásnyomra fókuszál."
            ExpectedProduct = "Annotált környéktérkép 3-5 ponttal és rövid indoklásokkal."
            EvidenceTypeLabel = "Térkép + megfigyelési jegyzet"
            ReflectionPrompt = "Melyik helyről derült ki, hogy több történetet hordoz, mint elsőre gondoltátok?"
            BPlan = "Rossz idő vagy külső séta nélkül használjatok nyomtatott térképet, fotókat vagy emlékezetből készített vázlatot."
            LowResource = "Nyomtatott térképlap és színes ceruza elég a munkához."
        },
        [ordered]@{
            Title = "Interjúkérdés-próba"
            Week = 3
            SortOrder = 1
            Phase = "cselekves"
            ShortDescription = "Interjúkérdések tervezése és kipróbálása egy Lauderhez kapcsolódó szereplő történetének feltárásához."
            StudentInstruction = "Írjatok 6-8 interjúkérdést egy volt vagy jelenlegi lauderessel, tanárral, szülővel vagy környékbeli szereplővel való beszélgetéshez. Próbáljátok ki egymáson, mely kérdések indítanak el történetet."
            TeacherSteps = @(
                "Mutasd meg a zárt és nyitott kérdések különbségét.",
                "Kérd a csapatokat, hogy minden kérdés mellé írják oda: milyen történetet vagy bizonyítékot remélnek tőle.",
                "Szervezz páros próba-interjút, ahol a másik csapat jelzi, melyik kérdés volt legerősebb.",
                "Beszéljétek meg az etikai alapokat: engedély, tisztelet, pontos idézés."
            )
            StudentChoice = "A csapat választhat, hogy személyes emlék, helytörténet, iskolai szokás vagy változás köré építi az interjút."
            ExpectedProduct = "Interjúterv 6-8 kérdéssel, szereplőjavaslattal és etikai ellenőrzőlistával."
            EvidenceTypeLabel = "Interjúterv + próba-reflexió"
            ReflectionPrompt = "Melyik kérdés váltott ki valódi történetet, és melyik maradt túl általános?"
            BPlan = "Ha nincs elérhető interjúalany, használjatok rövid forrásrészletet vagy osztályon belüli emlékgyűjtést."
            LowResource = "Papíralapú kérdéstervezővel és páros próba-interjúval is megvalósítható."
        },
        [ordered]@{
            Title = "Idővonal és fordulópontok"
            Week = 3
            SortOrder = 2
            Phase = "cselekves"
            ShortDescription = "A gyűjtött információk időrendbe rendezése, fordulópontok és bizonytalanságok jelölésével."
            StudentInstruction = "Készítsetek mini-idővonalat legalább öt eseménnyel vagy változással. Jelöljétek, melyik adat biztos, melyik feltételezés, és hol kell még forrást keresni."
            TeacherSteps = @(
                "Vezesd be a biztos adat, feltételezés és kérdés jelöléseit.",
                "Kérd meg a csapatokat, hogy minden eseményhez írjanak forrást vagy forráshiányt.",
                "Közösen válasszatok ki 2-3 fordulópontot, amelyet az album később hangsúlyozhat.",
                "Zárásként kérj egy mondatot arról, hogyan változott a csapat történetképe."
            )
            StudentChoice = "A csapat dönthet kronológiai, tematikus vagy helyszínhez kötött idővonal mellett."
            ExpectedProduct = "Mini-idővonal legalább öt elemmel, forrás- és bizonytalanságjelöléssel."
            EvidenceTypeLabel = "Idővonal + forrásjegyzet"
            ReflectionPrompt = "Melyik esemény tűnik fordulópontnak, és milyen bizonyíték kell még hozzá?"
            BPlan = "Ha kevés adat áll rendelkezésre, dolgozzatok három biztos ponttal és két nyitott kérdéssel."
            LowResource = "Cetlikkel és csomagolópapírral is elkészíthető."
        },
        [ordered]@{
            Title = "Albumlap prototípus"
            Week = 5
            SortOrder = 1
            Phase = "kepzelet"
            ShortDescription = "Egy albumoldal megtervezése, amely történetet, képet, térképet vagy idézetet kapcsol össze."
            StudentInstruction = "Tervezzetek egy albumlapot a csapatotok témájából. Legyen rajta cím, rövid történet, legalább egy vizuális elem, egy bizonyíték és egy kérdés az olvasónak."
            TeacherSteps = @(
                "Mutass két eltérő albumlap-szerkezetet: történetközpontú és térképközpontú verziót.",
                "Kérd a csapatokat, hogy először vázlatot készítsenek, ne végleges dizájnt.",
                "Szervezz galériasétát: minden csapat két visszajelzést kap másoktól.",
                "A visszajelzések után jelöljenek ki egy javítandó pontot."
            )
            StudentChoice = "A csapat választhat történet-, térkép-, interjú-, fotó- vagy tárgyközpontú albumlapot."
            ExpectedProduct = "Albumlap-vázlat címmel, történettel, vizuális elemmel, bizonyítékkal és olvasói kérdéssel."
            EvidenceTypeLabel = "Albumlap-vázlat + peer feedback"
            ReflectionPrompt = "Melyik visszajelzés segített a lapot érthetőbbé vagy érdekesebbé tenni?"
            BPlan = "Ha nincs digitális szerkesztőeszköz, készülhet kézzel rajzolt lapvázlat."
            LowResource = "A4-es papír, ceruza, filc és nyomtatott képek is elegendők."
        },
        [ordered]@{
            Title = "Közösségi bemutató és záró reflexió"
            Week = 6
            SortOrder = 1
            Phase = "reflexio"
            ShortDescription = "Az album bemutatása, tanulási bizonyítékok összekapcsolása és csapatreflexió."
            StudentInstruction = "Mutassátok be 3 percben az albumlapotokat: milyen kérdésből indultatok, milyen bizonyítékot találtatok, és mit változtatnátok, ha folytatnátok a kutatást?"
            TeacherSteps = @(
                "Adj közös bemutatási keretet: kérdés, bizonyíték, produktum, következő kérdés.",
                "A közönség minden csapatnak egy értő kérdést tegyen fel.",
                "A bemutatók után kérj egyéni és csapatreflexiót is.",
                "Zárd azzal, hogy az osztály kiválaszt 3-5 albumlapot, amelyet érdemes továbbfejleszteni."
            )
            StudentChoice = "A csapat dönthet élő prezentáció, poszter, digitális lap vagy rövid tárlatvezetés mellett."
            ExpectedProduct = "Bemutatott albumlap, rövid csapatreflexió és következő kutatási kérdés."
            EvidenceTypeLabel = "Bemutató + záró reflexió"
            ReflectionPrompt = "Mi lett személyesebb vagy fontosabb számotokra a Lauder történetéből a projekt végére?"
            BPlan = "Ha nincs közönség, tartsatok osztályon belüli minikiállítást és írásos visszajelző köröket."
            LowResource = "Nyomtatott vagy kézzel készített albumlapokkal is működik."
        }
    )
    Instance = [ordered]@{
        Title = "8.B Lauder története és környéke"
        ClassName = "8.B helytörténeti műhely"
        StartWeek = 1
        Teams = @(
            [ordered]@{
                Name = "Idővonal-kutatók"
                Focus = "Iskolatörténeti fordulópontok"
                Color = "#4f7cac"
                Members = @("Anna", "Márk", "Lili", "Dávid")
            },
            [ordered]@{
                Name = "Környékfigyelők"
                Focus = "Épített környezet és útvonalak"
                Color = "#58a585"
                Members = @("Zsófi", "Noel", "Mira", "Bálint")
            },
            [ordered]@{
                Name = "Emlékgyűjtők"
                Focus = "Interjúk és személyes történetek"
                Color = "#d38b46"
                Members = @("Júlia", "Áron", "Nóra", "Samu")
            },
            [ordered]@{
                Name = "Albumtervezők"
                Focus = "Vizuális szerkesztés és kiállítás"
                Color = "#8b6fc6"
                Members = @("Hédi", "Levi", "Emma", "Misi")
            }
        )
    }
    Evidence = @()
}

function New-DemoHeaders {
    param([string]$Role)

    $headers = @{}
    if (-not [string]::IsNullOrWhiteSpace($DemoToken)) {
        $headers["X-Demo-Token"] = $DemoToken
        $headers["X-Demo-Role"] = $Role
    }
    return $headers
}

function Read-ErrorBody {
    param($ErrorRecord)

    if ($ErrorRecord.ErrorDetails -and -not [string]::IsNullOrWhiteSpace($ErrorRecord.ErrorDetails.Message)) {
        return $ErrorRecord.ErrorDetails.Message
    }

    $response = $ErrorRecord.Exception.Response
    if ($null -eq $response) {
        return $ErrorRecord.Exception.Message
    }

    try {
        $stream = $response.GetResponseStream()
        if ($null -eq $stream) {
            return $ErrorRecord.Exception.Message
        }
        $reader = [System.IO.StreamReader]::new($stream)
        try {
            return $reader.ReadToEnd()
        }
        finally {
            $reader.Dispose()
        }
    }
    catch {
        return $ErrorRecord.Exception.Message
    }
}

function Invoke-AlbumApi {
    param(
        [ValidateSet("GET", "POST")]
        [string]$Method,
        [string]$Path,
        [object]$Body = $null,
        [string]$Role = "teacher"
    )

    $parameters = @{
        Method = $Method
        Uri = "$apiRoot$Path"
        Headers = New-DemoHeaders -Role $Role
    }

    if ($Method -ne "GET") {
        $parameters["ContentType"] = "application/json; charset=utf-8"
        # Send as UTF-8 bytes: Windows PowerShell 5.1's Invoke-RestMethod encodes string bodies as
        # ISO-8859-1 regardless of the charset declared in Content-Type, mangling Hungarian diacritics.
        $jsonBody = $Body | ConvertTo-Json -Depth 20
        $parameters["Body"] = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
    }

    try {
        return Invoke-RestMethod @parameters
    }
    catch {
        $bodyText = Read-ErrorBody -ErrorRecord $_
        throw "API hívás sikertelen: $Method $Path`n$bodyText"
    }
}

function Find-ByTitle {
    param(
        [object[]]$Items,
        [string]$Title
    )

    return @($Items) | Where-Object { $_.title -eq $Title } | Select-Object -First 1
}

function Get-LatestVersionId {
    param([object]$StickerDetail)

    $latest = @($StickerDetail.versions) | Sort-Object -Property versionNumber -Descending | Select-Object -First 1
    if ($null -eq $latest) {
        throw "A matrica létrejött, de nincs verziója: $($StickerDetail.title)"
    }
    return $latest.id
}

Write-Host "Lauder példaalbum betöltése: $($lauderAlbum.Template.Title)"
Write-Host "API: $apiRoot"

$stickerList = @(Invoke-AlbumApi -Method GET -Path "/stickers" -Role "teacher")
$stickerVersionIds = @{}

foreach ($sticker in $lauderAlbum.Stickers) {
    $existing = Find-ByTitle -Items $stickerList -Title $sticker.Title
    if ($null -ne $existing) {
        $stickerVersionIds[$sticker.Title] = $existing.latestVersionId
        Write-Host "Matrica már létezik: $($sticker.Title) -> $($existing.latestVersionId)"
        continue
    }

    $request = [ordered]@{
        title = $sticker.Title
        phase = $sticker.Phase
        shortDescription = $sticker.ShortDescription
        studentInstruction = $sticker.StudentInstruction
        teacherSteps = $sticker.TeacherSteps
        studentChoice = $sticker.StudentChoice
        expectedProduct = $sticker.ExpectedProduct
        evidenceTypeLabel = $sticker.EvidenceTypeLabel
        reflectionPrompt = $sticker.ReflectionPrompt
        bPlan = $sticker.BPlan
        lowResource = $sticker.LowResource
    }

    $created = Invoke-AlbumApi -Method POST -Path "/stickers" -Body $request -Role "teacher"
    $versionId = Get-LatestVersionId -StickerDetail $created
    $stickerVersionIds[$sticker.Title] = $versionId
    Write-Host "Matrica létrejött: $($sticker.Title) -> $versionId"
}

$templates = @(Invoke-AlbumApi -Method GET -Path "/album-templates" -Role "teacher")
$template = Find-ByTitle -Items $templates -Title $lauderAlbum.Template.Title

if ($null -eq $template) {
    $templateRequest = [ordered]@{
        title = $lauderAlbum.Template.Title
        subject = $lauderAlbum.Template.Subject
        grade = $lauderAlbum.Template.Grade
        durationType = $lauderAlbum.Template.DurationType
        drivingQuestion = $lauderAlbum.Template.DrivingQuestion
        finalProduct = $lauderAlbum.Template.FinalProduct
        audience = $lauderAlbum.Template.Audience
        dispositions = $lauderAlbum.Template.Dispositions
        weekTitles = $lauderAlbum.Template.WeekTitles
    }

    $templateDetail = Invoke-AlbumApi -Method POST -Path "/album-templates" -Body $templateRequest -Role "teacher"
    Write-Host "Albumterv létrejött: $($templateDetail.title) -> $($templateDetail.id)"

    # Brand-new templates now land as v1=draft. The seeder needs a published v1 so subsequent
    # sticker assignments and instance creation use a real version row (not the synthetic fallback).
    $templateDetail = Invoke-AlbumApi -Method POST -Path "/album-templates/$($templateDetail.id)/draft/publish" -Body @{} -Role "teacher"
    Write-Host "Albumterv v1 publikálva."
}
else {
    $templateDetail = Invoke-AlbumApi -Method GET -Path "/album-templates/$($template.id)" -Role "teacher"
    Write-Host "Albumterv már létezik: $($template.title) -> $($template.id)"
}

$assignedTitles = @{}
foreach ($assigned in @($templateDetail.stickers)) {
    $assignedTitles[$assigned.title] = $true
}

foreach ($sticker in $lauderAlbum.Stickers) {
    if ($assignedTitles.ContainsKey($sticker.Title)) {
        Write-Host "Matrica már hozzá van rendelve az albumtervhez: $($sticker.Title)"
        continue
    }

    $assignRequest = [ordered]@{
        stickerVersionId = $stickerVersionIds[$sticker.Title]
        week = $sticker.Week
        sortOrder = $sticker.SortOrder
    }

    $templateDetail = Invoke-AlbumApi -Method POST -Path "/album-templates/$($templateDetail.id)/stickers" -Body $assignRequest -Role "teacher"
    $assignedTitles[$sticker.Title] = $true
    Write-Host "Matrica albumtervhez rendelve: $($sticker.Title) (hét $($sticker.Week), sorrend $($sticker.SortOrder))"
}

$instances = @(Invoke-AlbumApi -Method GET -Path "/album-instances" -Role "teacher")
$instance = Find-ByTitle -Items $instances -Title $lauderAlbum.Instance.Title

if ($null -eq $instance) {
    $instanceRequest = [ordered]@{
        title = $lauderAlbum.Instance.Title
        className = $lauderAlbum.Instance.ClassName
        teams = $lauderAlbum.Instance.Teams
    }

    $instanceDetail = Invoke-AlbumApi -Method POST -Path "/album-templates/$($templateDetail.id)/instances" -Body $instanceRequest -Role "teacher"
    Write-Host "Futó album létrejött: $($instanceDetail.title) -> $($instanceDetail.id)"
}
else {
    $instanceDetail = Invoke-AlbumApi -Method GET -Path "/album-instances/$($instance.id)" -Role "teacher"
    Write-Host "Futó album már létezik: $($instance.title) -> $($instance.id)"
}

foreach ($evidence in $lauderAlbum.Evidence) {
    $targetSticker = @($instanceDetail.stickers) | Where-Object { $_.title -eq $evidence.StickerTitle } | Select-Object -First 1
    if ($null -eq $targetSticker) {
        throw "Evidence célmatrica nem található: $($evidence.StickerTitle)"
    }

    $targetTeam = @($instanceDetail.teams) | Where-Object { $_.name -eq $evidence.TeamName } | Select-Object -First 1
    if ($null -eq $targetTeam) {
        throw "Evidence célcsapat nem található: $($evidence.TeamName)"
    }

    $duplicateEvidence = @($instanceDetail.evidence) | Where-Object {
        $_.title -eq $evidence.Title -and $_.teamId -eq $targetTeam.id -and $_.instanceStickerId -eq $targetSticker.id
    } | Select-Object -First 1

    if ($null -ne $duplicateEvidence) {
        Write-Host "Evidence már létezik, kihagyva: $($evidence.Title)"
        continue
    }

    $helpRequested = $false
    if ($evidence.PSObject.Properties.Match('HelpRequested').Count -gt 0 -and $evidence.HelpRequested) {
        $helpRequested = $true
    }

    $evidenceRequest = [ordered]@{
        instanceStickerId = $targetSticker.id
        teamId = $targetTeam.id
        type = $evidence.Type
        title = $evidence.Title
        description = $evidence.Description
        helpRequest = $evidence.HelpRequest
        helpRequested = $helpRequested
        reflection = $evidence.Reflection
    }

    # POST /evidence now returns { evidence, progress }; navigate the new shape.
    $submission = Invoke-AlbumApi -Method POST -Path "/evidence" -Body $evidenceRequest -Role "student"
    $createdEvidence = $submission.evidence
    Write-Host "Evidence létrejött: $($createdEvidence.title) -> $($createdEvidence.id) (progress: $($submission.progress.state))"
}

Write-Host ""
Write-Host "Kész."
Write-Host "Albumterv ID: $($templateDetail.id)"
Write-Host "Futó album ID: $($instanceDetail.id)"
Write-Host "Evidence betöltve: $(@($lauderAlbum.Evidence).Count)"
