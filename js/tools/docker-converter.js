/**
 * Docker Run → Docker Compose 转换器
 * 解析 docker run 命令，生成 docker-compose.yml
 * 
 * 支持参数：
 * - 基础：-p/--publish, -v/--volume, -e/--env, --name, --restart
 * - 进阶：--network, --health-cmd, --health-interval, --detach
 * - 高级：--depends-on, --build, --command, --entrypoint, --env-file
 */
(function() {
  'use strict';

  // ==================== 解析器核心 ====================

  /**
   * 解析 docker run 命令
   * @param {string} command - docker run 命令字符串
   * @returns {object} 解析结果 { success, data?, error? }
   */
  function parseDockerRun(command) {
    if (!command || typeof command !== 'string') {
      return { success: false, error: '请输入 docker run 命令' };
    }

    command = command.trim();
    
    // 验证命令格式
    if (!command.startsWith('docker run')) {
      return { success: false, error: '命令必须以 "docker run" 开头' };
    }

    try {
      // 提取命令部分（去掉 "docker run"）
      var argsPart = command.substring(10).trim();
      var args = tokenizeArgs(argsPart);
      
      var parsed = parseArgs(args);
      
      return { success: true, data: parsed };
    } catch (e) {
      return { success: false, error: '解析失败：' + e.message };
    }
  }

  /**
   * 将参数字符串分割成数组（处理引号）
   */
  function tokenizeArgs(str) {
    var args = [];
    var current = '';
    var inSingleQuote = false;
    var inDoubleQuote = false;
    
    for (var i = 0; i < str.length; i++) {
      var char = str[i];
      var nextChar = str[i + 1];
      
      if (char === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
        continue;
      }
      
      if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        continue;
      }
      
      if (char === ' ' && !inSingleQuote && !inDoubleQuote) {
        if (current) {
          args.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    if (current) {
      args.push(current);
    }
    
    return args;
  }

  /**
   * 解析参数数组
   */
  function parseArgs(args) {
    var result = {
      image: null,
      containerName: null,
      ports: [],
      volumes: [],
      environment: [],
      envFiles: [],
      networks: [],
      restart: null,
      detach: false,
      command: null,
      entrypoint: null,
      healthcheck: null,
      dependsOn: [],
      build: null,
      workingDir: null,
      user: null,
      privileged: false,
      labels: []
    };
    
    var i = 0;
    var imageFound = false;
    
    while (i < args.length) {
      var arg = args[i];
      
      // 短参数
      if (arg === '-p' || arg === '--publish') {
        var portMapping = args[++i];
        if (portMapping) result.ports.push(portMapping);
      }
      else if (arg === '-v' || arg === '--volume') {
        var volume = args[++i];
        if (volume) result.volumes.push(volume);
      }
      else if (arg === '-e' || arg === '--env') {
        var env = args[++i];
        if (env) result.environment.push(env);
      }
      else if (arg === '--env-file') {
        var envFile = args[++i];
        if (envFile) result.envFiles.push(envFile);
      }
      else if (arg === '--name') {
        result.containerName = args[++i];
      }
      else if (arg === '--network') {
        result.networks.push(args[++i]);
      }
      else if (arg === '--restart') {
        result.restart = args[++i];
      }
      else if (arg === '--command' || arg === '-c') {
        result.command = args[++i];
      }
      else if (arg === '--entrypoint') {
        result.entrypoint = args[++i];
      }
      else if (arg === '--workdir') {
        result.workingDir = args[++i];
      }
      else if (arg === '--user' || arg === '-u') {
        result.user = args[++i];
      }
      else if (arg === '--label' || arg === '-l') {
        result.labels.push(args[++i]);
      }
      else if (arg === '--health-cmd') {
        if (!result.healthcheck) result.healthcheck = {};
        result.healthcheck.cmd = args[++i];
      }
      else if (arg === '--health-interval') {
        if (!result.healthcheck) result.healthcheck = {};
        result.healthcheck.interval = args[++i];
      }
      else if (arg === '--health-timeout') {
        if (!result.healthcheck) result.healthcheck = {};
        result.healthcheck.timeout = args[++i];
      }
      else if (arg === '--health-retries') {
        if (!result.healthcheck) result.healthcheck = {};
        result.healthcheck.retries = parseInt(args[++i], 10);
      }
      else if (arg === '--depends-on') {
        var dep = args[++i];
        if (dep) result.dependsOn.push(dep);
      }
      else if (arg === '--build') {
        result.build = args[++i] || '.';
      }
      else if (arg === '--privileged') {
        result.privileged = true;
      }
      else if (arg === '-d' || arg === '--detach') {
        result.detach = true;
      }
      // 镜像名（不以 - 开头的参数）
      else if (!arg.startsWith('-')) {
        if (!imageFound) {
          result.image = arg;
          imageFound = true;
        } else {
          // 可能是命令参数
          if (!result.command) {
            result.command = arg;
          }
        }
      }
      
      i++;
    }
    
    // 验证必须有镜像名
    if (!result.image) {
      throw new Error('未找到镜像名');
    }
    
    return result;
  }

  // ==================== YAML 生成器 ====================

  /**
   * 生成 docker-compose.yml 内容
   * @param {object} parsed - 解析后的数据
   * @returns {string} YAML 字符串
   */
  function generateComposeYaml(parsed) {
    var lines = [];
    
    lines.push('# docker-compose.yml');
    lines.push('# 由 Docker Run → Compose 转换器生成');
    lines.push('');
    lines.push('version: "3.8"');
    lines.push('');
    lines.push('services:');
    lines.push('  ' + serviceName(parsed) + ':');
    
    // 镜像
    if (parsed.image) {
      lines.push('    image: ' + parsed.image);
    }
    
    // 容器名
    if (parsed.containerName) {
      lines.push('    container_name: ' + parsed.containerName);
    }
    
    // 端口映射
    if (parsed.ports.length > 0) {
      lines.push('    ports:');
      parsed.ports.forEach(function(port) {
        lines.push('      - "' + port + '"');
      });
    }
    
    // 卷映射
    if (parsed.volumes.length > 0) {
      lines.push('    volumes:');
      parsed.volumes.forEach(function(volume) {
        lines.push('      - ' + volume);
      });
    }
    
    // 环境变量
    if (parsed.environment.length > 0) {
      lines.push('    environment:');
      parsed.environment.forEach(function(env) {
        lines.push('      - ' + formatEnv(env));
      });
    }
    
    // 环境变量文件
    if (parsed.envFiles.length > 0) {
      lines.push('    env_file:');
      parsed.envFiles.forEach(function(envFile) {
        lines.push('      - ' + envFile);
      });
    }
    
    // 网络
    if (parsed.networks.length > 0) {
      lines.push('    networks:');
      parsed.networks.forEach(function(network) {
        lines.push('      - ' + network);
      });
    }
    
    // 重启策略
    if (parsed.restart) {
      lines.push('    restart: ' + parsed.restart);
    }
    
    // 工作目录
    if (parsed.workingDir) {
      lines.push('    working_dir: ' + parsed.workingDir);
    }
    
    // 用户
    if (parsed.user) {
      lines.push('    user: ' + parsed.user);
    }
    
    // 命令
    if (parsed.command) {
      lines.push('    command: ' + parsed.command);
    }
    
    // 入口点
    if (parsed.entrypoint) {
      lines.push('    entrypoint: ' + parsed.entrypoint);
    }
    
    // 特权模式
    if (parsed.privileged) {
      lines.push('    privileged: true');
    }
    
    // 标签
    if (parsed.labels.length > 0) {
      lines.push('    labels:');
      parsed.labels.forEach(function(label) {
        lines.push('      - ' + formatEnv(label));
      });
    }
    
    // 健康检查
    if (parsed.healthcheck) {
      lines.push('    healthcheck:');
      if (parsed.healthcheck.cmd) {
        lines.push('      test: ["CMD-SHELL", ' + JSON.stringify(parsed.healthcheck.cmd) + ']');
      }
      if (parsed.healthcheck.interval) {
        lines.push('      interval: ' + parsed.healthcheck.interval);
      }
      if (parsed.healthcheck.timeout) {
        lines.push('      timeout: ' + parsed.healthcheck.timeout);
      }
      if (parsed.healthcheck.retries) {
        lines.push('      retries: ' + parsed.healthcheck.retries);
      }
    }
    
    // 依赖
    if (parsed.dependsOn.length > 0) {
      lines.push('    depends_on:');
      parsed.dependsOn.forEach(function(dep) {
        lines.push('      - ' + dep);
      });
    }
    
    // 构建配置（如果有 --build）
    if (parsed.build) {
      lines.push('    build:');
      lines.push('      context: ' + parsed.build);
    }
    
    lines.push('');
    
    // 网络定义（如果有自定义网络）
    if (parsed.networks.length > 0) {
      lines.push('networks:');
      parsed.networks.forEach(function(network) {
        lines.push('  ' + network + ':');
        lines.push('    driver: bridge');
      });
      lines.push('');
    }
    
    return lines.join('\n');
  }

  /**
   * 获取服务名
   */
  function serviceName(parsed) {
    if (parsed.containerName) {
      return parsed.containerName.replace(/[^a-zA-Z0-9_-]/g, '_');
    }
    var imageName = parsed.image.split(':')[0];
    return imageName.replace(/[/\\_-]/g, '_');
  }

  /**
   * 格式化环境变量
   */
  function formatEnv(env) {
    if (env.indexOf('=') === -1) {
      return env;
    }
    var parts = env.split('=');
    var key = parts[0];
    var value = parts.slice(1).join('=');
    
    // 如果值包含空格或特殊字符，用引号包裹
    if (value.match(/[ \t"']/) || value === '') {
      value = '"' + value.replace(/"/g, '\\"') + '"';
    }
    
    return key + '=' + value;
  }

  // ==================== 暴露 API ====================

  window.DockerConverter = {
    parse: parseDockerRun,
    generate: generateComposeYaml
  };

})();
