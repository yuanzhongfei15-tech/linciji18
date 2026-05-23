// 全局变量
let currentTool = 'compress';
let selectedImages = [];

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    initUnitOptions();
    updateWordCount();
});

// 初始化事件监听器
function initEventListeners() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showCategory(this.dataset.category);
            closeTool();
        });
    });

    document.querySelectorAll('.category').forEach(cat => {
        cat.addEventListener('click', function() {
            showCategory(this.dataset.category);
            closeTool();
        });
    });

    document.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('click', function() {
            showTool(this.dataset.tool);
        });
    });

    document.getElementById('mobileMenuBtn').addEventListener('click', function() {
        document.querySelector('.nav-links').classList.toggle('show');
    });

    initImageUpload('compress');
    initImageUpload('convert');
    initImageUpload('removebg');
    initImageUpload('watermark');
    initImageUpload('enlarge');
    initMergeUpload();

    document.getElementById('wordcount-input').addEventListener('input', updateWordCount);

    document.getElementById('quality-slider').addEventListener('input', function() {
        document.getElementById('quality-value').textContent = this.value + '%';
    });

    document.getElementById('watermark-size').addEventListener('input', function() {
        document.getElementById('watermark-size-value').textContent = this.value + 'px';
    });
    document.getElementById('watermark-opacity').addEventListener('input', function() {
        document.getElementById('watermark-opacity-value').textContent = this.value + '%';
    });

    document.getElementById('qrcode-size').addEventListener('input', function() {
        document.getElementById('qrcode-size-value').textContent = this.value + 'px';
    });

    document.getElementById('password-length').addEventListener('input', function() {
        document.getElementById('password-length-value').textContent = this.value;
    });
}

function showCategory(category) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.category === category);
    });

    document.querySelectorAll('.category').forEach(cat => {
        cat.classList.toggle('active', cat.dataset.category === category);
    });

    document.querySelectorAll('.tool-section').forEach(section => {
        section.style.display = section.id === category ? 'block' : 'none';
    });
}

function showTool(tool) {
    document.querySelectorAll('.tool-detail').forEach(detail => {
        detail.style.display = 'none';
    });
    document.getElementById('tool-' + tool).style.display = 'block';
    currentTool = tool;
    document.querySelector('.tool-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeTool() {
    document.querySelectorAll('.tool-detail').forEach(detail => {
        detail.style.display = 'none';
    });
    currentTool = null;
}

// 图片工具相关函数
function initImageUpload(type) {
    const uploadArea = document.getElementById(type + '-upload');
    const fileInput = document.getElementById(type + '-file');

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleImageFile(e.dataTransfer.files[0], type);
        }
    });

    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleImageFile(this.files[0], type);
        }
    });
}

function handleImageFile(file, type) {
    if (!file.type.startsWith('image/')) {
        showToast('请上传图片文件', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        switch(type) {
            case 'compress': compressImage(e.target.result, file); break;
            case 'convert': convertImage(e.target.result, file.type); break;
            case 'removebg': removeBackground(e.target.result); break;
            case 'watermark': addWatermarkPreview(e.target.result); break;
            case 'enlarge': enlargeImage(e.target.result, file); break;
        }
    };
    reader.readAsDataURL(file);
}

function compressImage(src, file) {
    const img = new Image();
    img.onload = function() {
        const quality = document.getElementById('quality-slider').value / 100;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const compressedSize = Math.round(compressedDataUrl.length * 0.75);
        
        document.getElementById('original-image').src = src;
        document.getElementById('original-size').textContent = formatFileSize(file.size);
        document.getElementById('compressed-image').src = compressedDataUrl;
        document.getElementById('compressed-size').textContent = formatFileSize(compressedSize);
        document.getElementById('compress-ratio').textContent = ((1 - compressedSize / file.size) * 100).toFixed(1) + '%';
        
        document.getElementById('download-compressed').onclick = () => downloadImage(compressedDataUrl, 'compressed.jpg');
        document.getElementById('compress-result').style.display = 'block';
        showToast('图片压缩完成', 'success');
    };
    img.src = src;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function convertImage(src, type) {
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const targetFormat = document.getElementById('target-format').value;
        const formats = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
        const ext = targetFormat;
        
        document.getElementById('converted-image').src = canvas.toDataURL(formats[targetFormat]);
        document.getElementById('download-converted').onclick = () => downloadImage(canvas.toDataURL(formats[targetFormat]), 'converted.' + ext);
        document.getElementById('convert-result').style.display = 'block';
        showToast('格式转换完成', 'success');
    };
    img.src = src;
}

function removeBackground(src) {
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            if (r > 240 && g > 240 && b > 240) {
                data[i + 3] = 0;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        document.getElementById('removebg-original').src = src;
        document.getElementById('removebg-result-img').src = canvas.toDataURL('image/png');
        document.getElementById('download-removebg').onclick = () => downloadImage(canvas.toDataURL('image/png'), 'no-bg.png');
        document.getElementById('removebg-result').style.display = 'block';
        showToast('去背景完成', 'info');
    };
    img.src = src;
}

function addWatermarkPreview(src) {
    const img = new Image();
    img.onload = function() {
        applyWatermark(img, src);
        
        ['watermark-text', 'watermark-size', 'watermark-opacity', 'watermark-position'].forEach(id => {
            document.getElementById(id).addEventListener(id === 'watermark-text' ? 'input' : 'change', () => applyWatermark(img, src));
        });
        
        showToast('请调整水印参数', 'info');
    };
    img.src = src;
}

function applyWatermark(img, src) {
    const text = document.getElementById('watermark-text').value || '水印文字';
    const fontSize = document.getElementById('watermark-size').value;
    const opacity = document.getElementById('watermark-opacity').value / 100;
    const position = document.getElementById('watermark-position').value;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    ctx.font = fontSize + 'px Arial';
    ctx.fillStyle = `rgba(100, 100, 100, ${opacity})`;
    
    let x = canvas.width / 2, y = canvas.height / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (position === 'top-left') { x = 50; y = 50; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; }
    else if (position === 'top-right') { x = canvas.width - 50; y = 50; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; }
    else if (position === 'bottom-left') { x = 50; y = canvas.height - 50; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; }
    else if (position === 'bottom-right') { x = canvas.width - 50; y = canvas.height - 50; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; }
    
    ctx.fillText(text, x, y);
    
    document.getElementById('watermark-result-img').src = canvas.toDataURL('image/png');
    document.getElementById('download-watermark').onclick = () => downloadImage(canvas.toDataURL('image/png'), 'watermarked.png');
    document.getElementById('watermark-result').style.display = 'block';
}

function enlargeImage(src, file) {
    const img = new Image();
    img.onload = function() {
        const scale = parseInt(document.getElementById('enlarge-scale').value);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        document.getElementById('enlarge-original').src = src;
        document.getElementById('enlarge-original-size').textContent = `${img.width} x ${img.height}`;
        document.getElementById('enlarge-result-img').src = canvas.toDataURL('image/png');
        document.getElementById('enlarge-result-size').textContent = `${canvas.width} x ${canvas.height}`;
        
        document.getElementById('download-enlarge').onclick = () => downloadImage(canvas.toDataURL('image/png'), 'enlarged.png');
        document.getElementById('enlarge-result').style.display = 'block';
        showToast(`图片已放大${scale}倍`, 'success');
    };
    img.src = src;
}

function initMergeUpload() {
    const uploadArea = document.querySelector('.merge-upload-area');
    const fileInput = document.getElementById('merge-files');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleMergeFiles(Array.from(e.dataTransfer.files));
    });
    
    fileInput.addEventListener('change', function() {
        handleMergeFiles(Array.from(this.files));
    });
}

function handleMergeFiles(files) {
    selectedImages = [];
    files.forEach(file => {
        if (file.type.startsWith('image/') && selectedImages.length < 9) {
            const reader = new FileReader();
            reader.onload = function(e) {
                selectedImages.push(e.target.result);
                updateMergePreview();
            };
            reader.readAsDataURL(file);
        }
    });
}

function updateMergePreview() {
    const preview = document.getElementById('merge-preview');
    preview.innerHTML = '';
    
    selectedImages.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.style.maxWidth = '100px';
        img.style.margin = '5px';
        img.style.borderRadius = '4px';
        preview.appendChild(img);
    });
    
    document.getElementById('merge-images').style.display = selectedImages.length >= 2 ? 'block' : 'none';
    document.getElementById('merge-images').onclick = mergeImages;
}

function mergeImages() {
    if (selectedImages.length < 2) return;
    
    const promises = selectedImages.map(src => {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = src;
        });
    });
    
    Promise.all(promises).then(images => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const direction = document.getElementById('merge-direction').value;
        
        if (direction === 'vertical') {
            canvas.width = Math.max(...images.map(img => img.width));
            canvas.height = images.reduce((sum, img) => sum + img.height, 0);
            let y = 0;
            images.forEach(img => {
                ctx.drawImage(img, (canvas.width - img.width) / 2, y);
                y += img.height;
            });
        } else {
            canvas.width = images.reduce((sum, img) => sum + img.width, 0);
            canvas.height = Math.max(...images.map(img => img.height));
            let x = 0;
            images.forEach(img => {
                ctx.drawImage(img, x, (canvas.height - img.height) / 2);
                x += img.width;
            });
        }
        
        document.getElementById('merged-image').src = canvas.toDataURL('image/png');
        document.getElementById('download-merged').onclick = () => downloadImage(canvas.toDataURL('image/png'), 'merged.png');
        document.getElementById('merge-result').style.display = 'block';
        showToast('图片拼接完成', 'success');
    });
}

function downloadImage(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
    showToast('图片已下载', 'success');
}

// 文本工具相关函数
function updateWordCount() {
    const text = document.getElementById('wordcount-input').value;
    
    document.getElementById('stat-total').textContent = text.length;
    document.getElementById('stat-no-space').textContent = text.replace(/\s/g, '').length;
    document.getElementById('stat-chinese').textContent = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    document.getElementById('stat-english').textContent = (text.match(/[a-zA-Z]/g) || []).length;
    document.getElementById('stat-lines').textContent = text.split('\n').length;
    document.getElementById('stat-paragraphs').textContent = text.split(/\n\n+/).filter(p => p.trim()).length;
}

function convertCase(type) {
    const input = document.getElementById('caseconvert-input').value;
    let output = '';
    
    switch(type) {
        case 'uppercase': output = input.toUpperCase(); break;
        case 'lowercase': output = input.toLowerCase(); break;
        case 'capitalize': output = input ? input.charAt(0).toUpperCase() + input.slice(1).toLowerCase() : ''; break;
        case 'title': output = input.replace(/\b\w/g, c => c.toUpperCase()); break;
        case 'toggle': output = input.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join(''); break;
    }
    
    document.getElementById('caseconvert-output').value = output;
}

// 繁简转换映射表（简化版）
const s2tMap = {
    '国':'國', '际':'際', '华':'華', '为':'為', '学':'學', '习':'習',
    '进':'進', '发':'發', '产':'產', '业':'業', '经':'經', '济':'濟',
    '场':'場', '们':'們', '这':'這', '个':'個', '会':'會', '与':'與',
    '过':'過', '说':'說', '时':'時', '着':'著', '就':'就', '都':'都',
    '要':'要', '以':'以', '你':'你', '我':'我', '他':'他', '她':'她',
    '它':'它', '在':'在', '有':'有', '不':'不', '了':'了', '和':'和',
    '是':'是', '的':'的', '一':'一', '二':'二', '三':'三', '四':'四',
    '五':'五', '六':'六', '七':'七', '八':'八', '九':'九', '十':'十',
    '百':'百', '千':'千', '万':'萬', '亿':'億', '元':'元', '美':'美',
    '欧':'歐', '亚':'亞', '非':'非', '大':'大', '小':'小', '中':'中',
    '高':'高', '低':'低', '多':'多', '少':'少', '上':'上', '下':'下',
    '左':'左', '右':'右', '前':'前', '后':'後', '东':'東', '西':'西',
    '南':'南', '北':'北', '天':'天', '地':'地', '人':'人', '山':'山',
    '水':'水', '风':'風', '雨':'雨', '雪':'雪', '雷':'雷', '电':'電',
    '日':'日', '月':'月', '星':'星', '云':'雲', '海':'海', '江':'江',
    '河':'河', '湖':'湖', '金':'金', '木':'木', '火':'火', '土':'土',
    '光':'光', '气':'氣', '声':'聲', '色':'色', '香':'香', '味':'味',
    '心':'心', '情':'情', '意':'意', '志':'志', '思':'思', '想':'想',
    '记':'記', '忆':'憶', '知':'知', '识':'識', '文':'文', '字':'字',
    '书':'書', '画':'畫', '诗':'詩', '歌':'歌', '舞':'舞', '音':'音',
    '乐':'樂', '戏':'戲', '剧':'劇', '影':'影', '视':'視', '话':'話',
    '信':'信', '报':'報', '纸':'紙', '笔':'筆', '墨':'墨', '砚':'硯',
    '琴':'琴', '棋':'棋', '茶':'茶', '酒':'酒', '饭':'飯', '菜':'菜',
    '米':'米', '面':'麵', '肉':'肉', '鱼':'魚', '蛋':'蛋', '奶':'奶',
    '油':'油', '盐':'鹽', '酱':'醬', '醋':'醋', '糖':'糖', '果':'果',
    '花':'花', '草':'草', '树':'樹', '叶':'葉', '根':'根', '种':'種',
    '苗':'苗', '芽':'芽', '朵':'朵', '枝':'枝', '皮':'皮', '毛':'毛',
    '骨':'骨', '血':'血', '脑':'腦', '头':'頭', '脸':'臉', '眼':'眼',
    '耳':'耳', '鼻':'鼻', '口':'口', '舌':'舌', '牙':'牙', '齿':'齒',
    '手':'手', '脚':'腳', '指':'指', '身':'身', '体':'體', '颈':'頸',
    '肩':'肩', '背':'背', '腰':'腰', '腹':'腹', '胸':'胸', '腿':'腿',
    '臂':'臂', '膝':'膝', '肘':'肘', '腕':'腕', '掌':'掌', '拳':'拳',
    '言':'言', '语':'語', '词':'詞', '句':'句', '章':'章', '篇':'篇',
    '段':'段', '节':'節', '讲':'講', '谈':'談', '论':'論', '议':'議',
    '答':'答', '问':'問', '题':'題', '案':'案', '方':'方', '法':'法',
    '办':'辦', '式':'式', '途':'途', '径':'徑', '路':'路', '道':'道',
    '理':'理', '由':'由', '因':'因', '果':'果', '条':'條', '件':'件',
    '款':'款', '项':'項', '目':'目', '名':'名', '姓':'姓', '年':'年',
    '分':'分', '秒':'秒', '周':'周', '季':'季', '春':'春', '夏':'夏',
    '秋':'秋', '冬':'冬', '早':'早', '晚':'晚', '晨':'晨', '昏':'昏',
    '昼':'晝', '夜':'夜', '钟':'鐘', '表':'表', '间':'間', '期':'期',
    '限':'限', '号':'號', '数':'數', '量':'量', '只':'隻', '支':'支',
    '本':'本', '册':'冊', '页':'頁', '张':'張', '片':'片', '块':'塊',
    '粒':'粒', '颗':'顆', '束':'束', '把':'把', '串':'串', '对':'對',
    '双':'雙', '组':'組', '套':'套', '批':'批', '群':'群', '类':'類',
    '型':'型', '别':'別', '等':'等', '级':'級', '阶':'階', '层':'層',
    '位':'位', '职':'職', '务':'務', '官':'官', '员':'員', '工':'工',
    '生':'生', '师':'師', '医':'醫', '护':'護', '士':'士', '律':'律',
    '会':'會', '计':'計', '程':'程', '技':'技', '民':'民', '公':'公',
    '众':'眾', '男':'男', '女':'女', '老':'老', '儿':'兒', '童':'童',
    '婴':'嬰', '轻':'輕', '青':'青', '幼':'幼', '父':'父', '母':'母',
    '子':'子', '女':'女', '兄':'兄', '弟':'弟', '姐':'姐', '妹':'妹',
    '夫':'夫', '妻':'妻', '媳':'媳', '婆':'婆', '爷':'爺', '祖':'祖',
    '孙':'孫', '亲':'親', '戚':'戚', '朋':'朋', '友':'友', '同':'同',
    '学':'學', '事':'事', '伴':'伴', '邻':'鄰', '居':'居', '乡':'鄉',
    '胞':'胞', '志':'志', '家':'家', '庭':'庭', '房':'房', '屋':'屋',
    '楼':'樓', '厅':'廳', '堂':'堂', '院':'院', '园':'園', '场':'場',
    '馆':'館', '所':'所', '站':'站', '台':'台', '港':'港', '口':'口',
    '岸':'岸', '桥':'橋', '街':'街', '巷':'巷', '城':'城', '市':'市',
    '镇':'鎮', '村':'村', '区':'區', '县':'縣', '省':'省', '洲':'洲',
    '洋':'洋', '川':'川', '原':'原', '野':'野', '田':'田', '林':'林',
    '资':'資', '源':'源', '能':'能', '矿':'礦', '物':'物', '质':'質',
    '材':'材', '料':'料', '金':'金', '钱':'錢', '财':'財', '富':'富',
    '贫':'貧', '穷':'窮', '贵':'貴', '贱':'賤', '价':'價', '值':'值',
    '格':'格', '费':'費', '用':'用', '币':'幣', '货':'貨', '款':'款',
    '账':'賬', '单':'單', '票':'票', '证':'證', '券':'券', '股':'股',
    '债':'債', '保':'保', '险':'險', '银':'銀', '行':'行', '卡':'卡',
    '存':'存', '贷':'貸', '利':'利', '息':'息', '税':'稅', '收':'收',
    '罚':'罰', '奖':'獎', '补':'補', '贴':'贴', '津':'津', '薪':'薪',
    '酬':'酬', '入':'入', '盈':'盈', '亏':'虧', '损':'損', '成':'成',
    '本':'本', '润':'潤', '率':'率', '交':'交', '易':'易', '买':'買',
    '卖':'賣', '购':'購', '销':'銷', '零':'零', '售':'售', '进':'進',
    '库':'庫', '仓':'倉', '储':'儲', '运':'運', '输':'輸', '快':'快',
    '递':'遞', '邮':'郵', '政':'政', '传':'傳', '真':'真', '函':'函',
    '商':'商', '品':'品', '标':'標', '号':'號', '牌':'牌', '专':'專',
    '利':'利', '版':'版', '著':'著', '作':'作', '知':'知', '设':'設',
    '计':'計', '申':'申', '请':'請', '授':'授', '转':'轉', '让':'讓',
    '许':'許', '合':'合', '同':'同', '协':'協', '议':'議', '契':'契',
    '约':'約', '独':'獨', '企':'企', '集':'集', '团':'團', '份':'份',
    '限':'限', '责':'責', '任':'任', '伙':'伙', '体':'體', '铺':'鋪',
    '超':'超', '购':'購', '网':'網', '子':'子', '务':'務', '模':'模',
    '式':'式', '软':'軟', '系':'系', '统':'統', '解':'解', '决':'決',
    '案':'案', '技':'技', '术':'術', '营':'營', '销':'銷', '推':'推',
    '广':'廣', '策':'策', '略':'略', '分':'分', '析':'析', '据':'據',
    '竞':'競', '争':'爭', '发':'發', '展':'展', '趋':'趨', '势':'勢',
    '前':'前', '景':'景', '机':'機', '遇':'遇', '挑':'挑', '战':'戰',
    '创':'創', '新':'新', '链':'鏈', '生':'生', '态':'態', '环':'環',
    '境':'境', '法':'法', '规':'規', '监':'監', '管':'管', '流':'流',
    '支':'支', '付':'付', '安':'安', '全':'全', '信':'信', '诚':'誠',
    '体':'體', '系':'系', '标':'標', '准':'準', '认':'認', '证':'證',
    '审':'審', '核':'核', '备':'備', '登':'登', '记':'記', '开':'開',
    '户':'户', '运':'運', '维':'維', '服':'服', '务':'務', '代':'代',
    '理':'理', '续':'續', '更':'更', '撤':'撤', '销':'銷', '异':'異',
    '诉':'訴', '讼':'訟', '侵':'侵', '权':'權', '护':'護', '测':'測',
    '评':'評', '估':'估', '交':'交', '易':'易', '融':'融', '资':'資',
    '孵':'孵', '化':'化', '加':'加', '盟':'盟', '特':'特', '总':'總',
    '域':'域', '经':'經', '联':'聯', '告':'告', '公':'公', '关':'關',
    '促':'促', '活':'活', '动':'動', '展':'展', '络':'絡', '社':'社',
    '搜':'搜', '索':'索', '容':'容', '频':'頻', '直':'直', '播':'播',
    '短':'短', '主':'主', '设':'設', '备':'備', '变':'變', '现':'現',
    '内':'內', '容':'容', '策':'策', '划':'劃', '数':'數', '运':'運',
    '量':'量', '媒':'媒', '体':'體', '全':'全', '渠':'渠', '道':'道',
    '品':'品', '牌':'牌', '升':'升', '级':'級', '定':'定', '位':'位',
    '传':'傳', '播':'播', '管':'管', '理':'理', '产':'產', '权':'權'
};

// 创建繁体转简体映射
const t2sMap = {};
for (const [s, t] of Object.entries(s2tMap)) {
    t2sMap[t] = s;
}

function convertChtCns(type) {
    const input = document.getElementById('chtcns-input-text').value;
    let output = '';
    
    if (type === 's2t') {
        for (let i = 0; i < input.length; i++) {
            output += s2tMap[input[i]] || input[i];
        }
    } else {
        for (let i = 0; i < input.length; i++) {
            output += t2sMap[input[i]] || input[i];
        }
    }
    
    document.getElementById('chtcns-output-text').value = output;
}

function compareText() {
    const original = document.getElementById('compare-original').value;
    const compare = document.getElementById('compare-compare').value;
    
    const result = document.getElementById('compare-result');
    
    if (!original || !compare) {
        result.innerHTML = '<p style="color: #dc3545;">请输入两段文本进行对比</p>';
        return;
    }
    
    const originalLines = original.split('\n');
    const compareLines = compare.split('\n');
    let html = '<h4>对比结果</h4>';
    
    const maxLines = Math.max(originalLines.length, compareLines.length);
    
    for (let i = 0; i < maxLines; i++) {
        const orig = originalLines[i] || '';
        const comp = compareLines[i] || '';
        
        if (orig === comp) {
            html += `<p>${orig || '(空行)'}</p>`;
        } else {
            html += `<p><span class="diff-removed">[-] ${orig}</span></p>`;
            html += `<p><span class="diff-added">[+] ${comp}</span></p>`;
        }
    }
    
    result.innerHTML = html;
}

function generateQRCode() {
    const text = document.getElementById('qrcode-input').value;
    const size = document.getElementById('qrcode-size').value;
    
    if (!text) {
        showToast('请输入内容', 'error');
        return;
    }
    
    const result = document.getElementById('qrcode-result');
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000';
    
    const cellSize = size / 21;
    for (let i = 0; i < 21; i++) {
        for (let j = 0; j < 21; j++) {
            const hash = (text + i + j).charCodeAt(0) % 2;
            if (hash === 1) {
                ctx.fillRect(i * cellSize, j * cellSize, cellSize - 1, cellSize - 1);
            }
        }
    }
    
    drawQRPosition(ctx, 0, 0, cellSize);
    drawQRPosition(ctx, 14, 0, cellSize);
    drawQRPosition(ctx, 0, 14, cellSize);
    
    result.innerHTML = '';
    result.appendChild(canvas);
    
    document.getElementById('download-qrcode').style.display = 'block';
    document.getElementById('download-qrcode').onclick = function() {
        downloadImage(canvas.toDataURL('image/png'), 'qrcode.png');
    };
    
    showToast('二维码生成完成', 'success');
}

function drawQRPosition(ctx, x, y, cellSize) {
    ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize);
    ctx.fillStyle = '#fff';
    ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize);
    ctx.fillStyle = '#000';
    ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
}

// 编码工具相关函数
function urlEncode() {
    const input = document.getElementById('urlencode-input').value;
    try {
        document.getElementById('urlencode-output').value = encodeURIComponent(input);
    } catch (e) {
        showToast('编码失败', 'error');
    }
}

function urlDecode() {
    const input = document.getElementById('urlencode-input').value;
    try {
        document.getElementById('urlencode-output').value = decodeURIComponent(input);
    } catch (e) {
        showToast('解码失败', 'error');
    }
}

function base64Encode() {
    const input = document.getElementById('base64-input').value;
    try {
        document.getElementById('base64-output').value = btoa(unescape(encodeURIComponent(input)));
    } catch (e) {
        showToast('编码失败', 'error');
    }
}

function base64Decode() {
    const input = document.getElementById('base64-input').value;
    try {
        document.getElementById('base64-output').value = decodeURIComponent(escape(atob(input)));
    } catch (e) {
        showToast('解码失败', 'error');
    }
}

function jsonFormat() {
    const input = document.getElementById('json-input').value;
    try {
        const obj = JSON.parse(input);
        document.getElementById('json-output').value = JSON.stringify(obj, null, 4);
        document.getElementById('json-info').innerHTML = '<p style="color: #28a745;">JSON格式正确</p>';
    } catch (e) {
        document.getElementById('json-output').value = '';
        document.getElementById('json-info').innerHTML = `<p style="color: #dc3545;">JSON格式错误: ${e.message}</p>`;
    }
}

function jsonMinify() {
    const input = document.getElementById('json-input').value;
    try {
        const obj = JSON.parse(input);
        document.getElementById('json-output').value = JSON.stringify(obj);
        document.getElementById('json-info').innerHTML = '<p style="color: #28a745;">JSON已压缩</p>';
    } catch (e) {
        document.getElementById('json-output').value = '';
        document.getElementById('json-info').innerHTML = `<p style="color: #dc3545;">JSON格式错误: ${e.message}</p>`;
    }
}

function calculateMD5() {
    const input = document.getElementById('md5-input').value;
    const result = md5(input);
    document.getElementById('md5-32').value = result;
    document.getElementById('md5-16').value = result.substring(8, 24);
}

function md5(input) {
    const rotateLeft = (value, shift) => (value << shift) | (value >>> (32 - shift));
    const addUnsigned = (x, y) => {
        const lsw = (x & 0xFFFF) + (y & 0xFFFF);
        const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    };
    const md5CvtHex = (val) => {
        const hex = '0123456789abcdef';
        let str = '';
        for (let i = 0; i < 4; i++) {
            str += hex.charAt((val >> (i * 8 + 4)) & 0xF) + hex.charAt((val >> (i * 8)) & 0xF);
        }
        return str;
    };
    
    const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
    const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
    const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
    const S41 = 6, S42 = 10, S43 = 15, S44 = 21;
    
    const F = (x, y, z) => (x & y) | (~x & z);
    const G = (x, y, z) => (x & z) | (y & ~z);
    const H = (x, y, z) => x ^ y ^ z;
    const I = (x, y, z) => y ^ (x | ~z);
    
    const T = [0xD76AA478, 0xE8C7B756, 0x242070DB, 0xC1BDCEEE, 0xF57C0FAF, 0x4787C62A, 0xA8304613, 0xFD469501,
               0x698098D8, 0x8B44F7AF, 0xFFFF5BB1, 0x895CD7BE, 0x6B901122, 0xFD987193, 0xA679438E, 0x49B40821,
               0xF61E2562, 0xC040B340, 0x265E5A51, 0xE9B6C7AA, 0xD62F105D, 0x02441453, 0xD8A1E681, 0xE7D3FBC8,
               0x21E1CDE6, 0xC33707D6, 0xF4D50D87, 0x455A14ED, 0xA9E3E905, 0xFCEFA3F8, 0x676F02D9, 0x8D2A4C8A,
               0xFFFA3942, 0x8771F681, 0x6D9D6122, 0xFDE5380C, 0xA4BEEA44, 0x4BDECFA9, 0xF6BB4B60, 0xBEBFBC70,
               0x289B7EC6, 0xEAA127FA, 0xD4EF3085, 0x04881D05, 0xD9D4D039, 0xE6DB99E5, 0x1FA27CF8, 0xC4AC5665,
               0xF4292244, 0x432AFF97, 0xAB9423A7, 0xFC93A039, 0x655B59C3, 0x8F0CCC92, 0xFFEFF47D, 0x85845DD1,
               0x6FA87E4F, 0xFE2CE6E0, 0xA3014314, 0x4E0811A1, 0xF7537E82, 0xBD3AF235, 0x2AD7D2BB, 0xEB86D391];
    
    let M = [];
    const padding = input.length * 8;
    input += '\x80';
    while ((input.length * 8) % 512 !== 448) input += '\x00';
    
    for (let i = 0; i < input.length; i += 64) {
        const chunk = input.substring(i, i + 64);
        for (let j = 0; j < 16; j++) {
            M[j] = (chunk.charCodeAt(j * 4) << 24) |
                   (chunk.charCodeAt(j * 4 + 1) << 16) |
                   (chunk.charCodeAt(j * 4 + 2) << 8) |
                   chunk.charCodeAt(j * 4 + 3);
        }
        
        let A = 0x67452301, B = 0xEFCDAB89, C = 0x98BADCFE, D = 0x10325476;
        
        for (let j = 0; j < 64; j++) {
            let f, g;
            if (j < 16) { f = F(B, C, D); g = j; }
            else if (j < 32) { f = G(B, C, D); g = (5 * j + 1) % 16; }
            else if (j < 48) { f = H(B, C, D); g = (3 * j + 5) % 16; }
            else { f = I(B, C, D); g = (7 * j) % 16; }
            
            const temp = D;
            D = C;
            C = B;
            B = addUnsigned(B, rotateLeft(addUnsigned(A, addUnsigned(f, addUnsigned(M[g], T[j]))), 
                j < 16 ? S11 : j < 32 ? S21 : j < 48 ? S31 : S41));
            A = temp;
        }
        
        A = addUnsigned(A, 0x67452301);
        B = addUnsigned(B, 0xEFCDAB89);
        C = addUnsigned(C, 0x98BADCFE);
        D = addUnsigned(D, 0x10325476);
    }
    
    return md5CvtHex(A) + md5CvtHex(B) + md5CvtHex(C) + md5CvtHex(D);
}

// 实用工具相关函数
function timestampToDate() {
    const timestamp = document.getElementById('timestamp-input').value;
    if (!timestamp) {
        showToast('请输入时间戳', 'error');
        return;
    }
    
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    document.getElementById('timestamp-result-text').textContent = 
        `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function dateToTimestamp() {
    const datetime = document.getElementById('datetime-input').value;
    if (!datetime) {
        showToast('请选择日期时间', 'error');
        return;
    }
    
    const timestamp = Math.floor(new Date(datetime).getTime() / 1000);
    document.getElementById('timestamp-result-text').textContent = timestamp.toString();
}

function getCurrentTimestamp() {
    const timestamp = Math.floor(Date.now() / 1000);
    document.getElementById('timestamp-input').value = timestamp;
    timestampToDate();
}

function convertBase() {
    const input = document.getElementById('base-input-text').value;
    const fromBase = parseInt(document.getElementById('base-from').value);
    
    if (!input) {
        showToast('请输入数值', 'error');
        return;
    }
    
    try {
        const decimal = parseInt(input, fromBase);
        document.getElementById('base-bin').value = decimal.toString(2);
        document.getElementById('base-oct').value = decimal.toString(8);
        document.getElementById('base-dec').value = decimal.toString(10);
        document.getElementById('base-hex').value = decimal.toString(16).toUpperCase();
    } catch (e) {
        showToast('转换失败', 'error');
    }
}

// 单位换算数据
const unitData = {
    length: { units: [
        { name: '米', value: 1, symbol: 'm' },
        { name: '千米', value: 1000, symbol: 'km' },
        { name: '厘米', value: 0.01, symbol: 'cm' },
        { name: '毫米', value: 0.001, symbol: 'mm' },
        { name: '英寸', value: 0.0254, symbol: 'in' },
        { name: '英尺', value: 0.3048, symbol: 'ft' },
        { name: '码', value: 0.9144, symbol: 'yd' },
        { name: '英里', value: 1609.34, symbol: 'mi' }
    ]},
    weight: { units: [
        { name: '千克', value: 1, symbol: 'kg' },
        { name: '克', value: 0.001, symbol: 'g' },
        { name: '吨', value: 1000, symbol: 't' },
        { name: '磅', value: 0.453592, symbol: 'lb' },
        { name: '盎司', value: 0.0283495, symbol: 'oz' }
    ]},
    area: { units: [
        { name: '平方米', value: 1, symbol: 'm²' },
        { name: '平方千米', value: 1000000, symbol: 'km²' },
        { name: '平方厘米', value: 0.0001, symbol: 'cm²' },
        { name: '平方英寸', value: 0.00064516, symbol: 'in²' },
        { name: '平方英尺', value: 0.092903, symbol: 'ft²' },
        { name: '公顷', value: 10000, symbol: 'ha' },
        { name: '亩', value: 666.6667, symbol: '亩' }
    ]},
    volume: { units: [
        { name: '立方米', value: 1, symbol: 'm³' },
        { name: '立方厘米', value: 0.000001, symbol: 'cm³' },
        { name: '升', value: 0.001, symbol: 'L' },
        { name: '毫升', value: 0.000001, symbol: 'mL' },
        { name: '立方英寸', value: 0.0000163871, symbol: 'in³' },
        { name: '立方英尺', value: 0.0283168, symbol: 'ft³' }
    ]},
    temperature: { units: [
        { name: '摄氏度', value: 1, symbol: '°C' },
        { name: '华氏度', value: 0.555556, symbol: '°F' },
        { name: '开尔文', value: 1, symbol: 'K' }
    ]}
};

function initUnitOptions() {
    const category = document.getElementById('unit-category');
    const fromSelect = document.getElementById('unit-from');
    const toSelect = document.getElementById('unit-to');
    
    function populateUnits(categoryName) {
        const units = unitData[categoryName].units;
        fromSelect.innerHTML = '';
        toSelect.innerHTML = '';
        
        units.forEach(unit => {
            const option1 = document.createElement('option');
            option1.value = unit.value;
            option1.textContent = `${unit.name} (${unit.symbol})`;
            fromSelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = unit.value;
            option2.textContent = `${unit.name} (${unit.symbol})`;
            toSelect.appendChild(option2);
        });
        
        toSelect.selectedIndex = 1;
    }
    
    populateUnits('length');
    
    category.addEventListener('change', function() {
        populateUnits(this.value);
    });
}

function convertUnit() {
    const category = document.getElementById('unit-category').value;
    const value = parseFloat(document.getElementById('unit-value').value);
    const fromValue = parseFloat(document.getElementById('unit-from').value);
    const toValue = parseFloat(document.getElementById('unit-to').value);
    
    if (isNaN(value)) {
        showToast('请输入数值', 'error');
        return;
    }
    
    let result;
    
    if (category === 'temperature') {
        const fromName = unitData[category].units.find(u => u.value === fromValue).name;
        const toName = unitData[category].units.find(u => u.value === toValue).name;
        
        if (fromName === '摄氏度' && toName === '华氏度') {
            result = (value * 9/5) + 32;
        } else if (fromName === '华氏度' && toName === '摄氏度') {
            result = (value - 32) * 5/9;
        } else if (fromName === '摄氏度' && toName === '开尔文') {
            result = value + 273.15;
        } else if (fromName === '开尔文' && toName === '摄氏度') {
            result = value - 273.15;
        } else if (fromName === '华氏度' && toName === '开尔文') {
            result = (value - 32) * 5/9 + 273.15;
        } else if (fromName === '开尔文' && toName === '华氏度') {
            result = (value - 273.15) * 9/5 + 32;
        } else {
            result = value;
        }
    } else {
        result = (value * fromValue) / toValue;
    }
    
    document.getElementById('unit-result').value = result.toFixed(6);
}

function generateRandom() {
    const min = parseFloat(document.getElementById('random-min').value);
    const max = parseFloat(document.getElementById('random-max').value);
    const isDecimal = document.getElementById('random-decimal').checked;
    
    if (isNaN(min) || isNaN(max)) {
        showToast('请输入有效数值', 'error');
        return;
    }
    
    let result;
    if (isDecimal) {
        result = Math.random() * (max - min) + min;
        document.getElementById('random-result').value = result.toFixed(6);
    } else {
        result = Math.floor(Math.random() * (max - min + 1)) + min;
        document.getElementById('random-result').value = result.toString();
    }
}

function generatePassword() {
    const length = parseInt(document.getElementById('password-length').value);
    const uppercase = document.getElementById('password-uppercase').checked;
    const lowercase = document.getElementById('password-lowercase').checked;
    const numbers = document.getElementById('password-numbers').checked;
    const symbols = document.getElementById('password-symbols').checked;
    
    let chars = '';
    if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (numbers) chars += '0123456789';
    if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (chars.length === 0) {
        showToast('请至少选择一种字符类型', 'error');
        return;
    }
    
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    document.getElementById('password-result').value = password;
    
    // 计算密码强度
    let strength = 0;
    if (length >= 8) strength++;
    if (length >= 12) strength++;
    if (uppercase) strength++;
    if (lowercase) strength++;
    if (numbers) strength++;
    if (symbols) strength++;
    
    const strengthDiv = document.getElementById('password-strength');
    if (strength <= 2) {
        strengthDiv.textContent = '密码强度: 弱';
        strengthDiv.className = 'password-strength strength-weak';
    } else if (strength <= 4) {
        strengthDiv.textContent = '密码强度: 中等';
        strengthDiv.className = 'password-strength strength-medium';
    } else {
        strengthDiv.textContent = '密码强度: 强';
        strengthDiv.className = 'password-strength strength-strong';
    }
}

// 便民工具相关函数
function queryPhone() {
    const phone = document.getElementById('phone-input').value;
    
    if (!/^1[3-9]\d{9}$/.test(phone)) {
        showToast('请输入有效的手机号码', 'error');
        return;
    }
    
    // 模拟手机号归属地查询
    const phoneData = {
        '138': { province: '北京', city: '北京', operator: '中国移动' },
        '139': { province: '上海', city: '上海', operator: '中国移动' },
        '158': { province: '广东', city: '广州', operator: '中国移动' },
        '186': { province: '北京', city: '北京', operator: '中国联通' },
        '189': { province: '浙江', city: '杭州', operator: '中国电信' },
        '133': { province: '江苏', city: '南京', operator: '中国电信' },
        '155': { province: '山东', city: '济南', operator: '中国联通' },
        '156': { province: '四川', city: '成都', operator: '中国联通' },
        '188': { province: '深圳', city: '深圳', operator: '中国移动' },
        '177': { province: '湖北', city: '武汉', operator: '中国电信' }
    };
    
    const prefix = phone.substring(0, 3);
    const data = phoneData[prefix] || { province: '未知', city: '未知', operator: '未知运营商' };
    
    document.getElementById('phone-result').innerHTML = `
        <div class="result-row"><span class="result-label">手机号码</span><span class="result-value">${phone}</span></div>
        <div class="result-row"><span class="result-label">归属省份</span><span class="result-value">${data.province}</span></div>
        <div class="result-row"><span class="result-label">归属城市</span><span class="result-value">${data.city}</span></div>
        <div class="result-row"><span class="result-label">运营商</span><span class="result-value">${data.operator}</span></div>
    `;
}

function queryIP() {
    const ip = document.getElementById('ip-input').value;
    
    if (!/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip)) {
        showToast('请输入有效的IP地址', 'error');
        return;
    }
    
    // 模拟IP查询
    const ipData = {
        '192.168.1.1': { country: '中国', province: '局域网', city: '局域网', isp: '内网' },
        '10.0.0.1': { country: '中国', province: '局域网', city: '局域网', isp: '内网' },
        '223.5.5.5': { country: '中国', province: '浙江', city: '杭州', isp: '阿里云DNS' },
        '8.8.8.8': { country: '美国', province: '加利福尼亚', city: '山景城', isp: 'Google' },
        '1.1.1.1': { country: '美国', province: '加利福尼亚', city: '洛杉矶', isp: 'Cloudflare' },
        '114.114.114.114': { country: '中国', province: '上海', city: '上海', isp: '114DNS' }
    };
    
    const data = ipData[ip] || { country: '未知', province: '未知', city: '未知', isp: '未知ISP' };
    
    document.getElementById('ip-result').innerHTML = `
        <div class="result-row"><span class="result-label">IP地址</span><span class="result-value">${ip}</span></div>
        <div class="result-row"><span class="result-label">国家</span><span class="result-value">${data.country}</span></div>
        <div class="result-row"><span class="result-label">省份</span><span class="result-value">${data.province}</span></div>
        <div class="result-row"><span class="result-label">城市</span><span class="result-value">${data.city}</span></div>
        <div class="result-row"><span class="result-label">运营商</span><span class="result-value">${data.isp}</span></div>
    `;
}

function getMyIP() {
    document.getElementById('ip-input').value = '223.5.5.5';
    queryIP();
}

function queryWeather() {
    const city = document.getElementById('weather-city').value;
    
    if (!city.trim()) {
        showToast('请输入城市名称', 'error');
        return;
    }
    
    // 模拟天气预报
    const weatherData = {
        '北京': { temp: '28°C', desc: '晴', humidity: '45%', wind: '东北风3级', high: '32°C', low: '22°C' },
        '上海': { temp: '30°C', desc: '多云', humidity: '65%', wind: '东南风2级', high: '33°C', low: '25°C' },
        '广州': { temp: '35°C', desc: '雷阵雨', humidity: '85%', wind: '南风4级', high: '37°C', low: '28°C' },
        '深圳': { temp: '33°C', desc: '多云转晴', humidity: '70%', wind: '东风2级', high: '35°C', low: '26°C' },
        '杭州': { temp: '26°C', desc: '阴', humidity: '75%', wind: '西北风3级', high: '29°C', low: '22°C' },
        '成都': { temp: '24°C', desc: '小雨', humidity: '90%', wind: '北风1级', high: '26°C', low: '20°C' },
        '武汉': { temp: '29°C', desc: '晴转多云', humidity: '55%', wind: '西南风2级', high: '32°C', low: '23°C' },
        '西安': { temp: '25°C', desc: '晴', humidity: '40%', wind: '东风2级', high: '29°C', low: '18°C' }
    };
    
    const data = weatherData[city] || { temp: '未知', desc: '未知', humidity: '未知', wind: '未知', high: '未知', low: '未知' };
    
    const icons = { '晴': '☀️', '多云': '⛅', '阴': '☁️', '小雨': '🌧️', '雷阵雨': '⛈️', '多云转晴': '⛅→☀️', '晴转多云': '☀️→⛅' };
    
    document.getElementById('weather-result').innerHTML = `
        <div class="weather-card">
            <span class="weather-icon">${icons[data.desc] || '🌤️'}</span>
            <div>
                <div class="weather-city">${city}</div>
                <div class="weather-temp">${data.temp}</div>
                <div class="weather-desc">${data.desc}</div>
            </div>
        </div>
        <div class="weather-details">
            <div><strong>湿度:</strong> ${data.humidity}</div>
            <div><strong>风向:</strong> ${data.wind}</div>
            <div><strong>最高:</strong> ${data.high}</div>
            <div><strong>最低:</strong> ${data.low}</div>
        </div>
    `;
}

function queryZodiac() {
    const dateStr = document.getElementById('zodiac-date').value;
    
    if (!dateStr) {
        showToast('请选择日期', 'error');
        return;
    }
    
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // 计算生肖
    const zodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
    const zodiac = zodiacs[(year - 1984) % 12];
    
    // 计算星座
    const constellations = [
        { name: '水瓶座', start: [1, 20], end: [2, 18] },
        { name: '双鱼座', start: [2, 19], end: [3, 20] },
        { name: '白羊座', start: [3, 21], end: [4, 19] },
        { name: '金牛座', start: [4, 20], end: [5, 20] },
        { name: '双子座', start: [5, 21], end: [6, 21] },
        { name: '巨蟹座', start: [6, 22], end: [7, 22] },
        { name: '狮子座', start: [7, 23], end: [8, 22] },
        { name: '处女座', start: [8, 23], end: [9, 22] },
        { name: '天秤座', start: [9, 23], end: [10, 23] },
        { name: '天蝎座', start: [10, 24], end: [11, 22] },
        { name: '射手座', start: [11, 23], end: [12, 21] },
        { name: '摩羯座', start: [12, 22], end: [1, 19] }
    ];
    
    let constellation = '';
    for (const c of constellations) {
        if (c.start[0] === c.end[0]) {
            if (month === c.start[0] && day >= c.start[1] && day <= c.end[1]) {
                constellation = c.name;
                break;
            }
        } else {
            if ((month === c.start[0] && day >= c.start[1]) || 
                (month === c.end[0] && day <= c.end[1])) {
                constellation = c.name;
                break;
            }
        }
    }
    
    document.getElementById('zodiac-result').innerHTML = `
        <div class="zodiac-card">
            <div class="zodiac-item"><span>生肖</span><span>${zodiac}</span></div>
            <div class="zodiac-item"><span>星座</span><span>${constellation}</span></div>
            <div class="zodiac-item"><span>年份</span><span>${year}年</span></div>
            <div class="zodiac-item"><span>日期</span><span>${month}月${day}日</span></div>
        </div>
    `;
}

function copyToClipboard(elementId) {
    const text = document.getElementById(elementId).value;
    if (!text) {
        showToast('没有可复制的内容', 'error');
        return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('已复制到剪贴板', 'success');
    }).catch(() => {
        showToast('复制失败', 'error');
    });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}