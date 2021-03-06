angular.module('App')
	.controller('TemperatureCtrl', function($scope, $ionicPopup, $http, $ionicLoading, $rootScope, $cordovaToast) {

		var uid = window.localStorage.uid;

		$scope.Resuly = '00.0';
		$scope.isConnect = '扫描蓝牙设备...';
		$scope.address = false;

		$scope.service = $rootScope.systemName == 1 ? '1809' : '00001809-0000-1000-8000-00805f9b34fb';
		$scope.characteristic = $rootScope.systemName == 1 ? '2a1c' : '00002a1c-0000-1000-8000-00805f9b34fb';

		//保存
		$scope.save = function() {

			if(!$rootScope.isOnline) {
				//无网络状态
				$cordovaToast.showShortBottom('无可用网络').then(function(success) {
					// success
				}, function(error) {
					// error
				});
				return true;
			}

			$ionicLoading.show({
				template: 'Loading...'
			});

			$http.get("http://xxx/data_tiwen_post.php?code=xxx&uid=" + uid + "&dushu=" + $scope.Resuly)
				.success(function(response) {

					if(response[0]["_postok"] == 1) {

					}
					$ionicLoading.hide();
				}).error(function(data) {
					$ionicLoading.hide();
					alert("err");
				});

		}

		//清除
		$scope.again = function() {

			$scope.Resuly = '00.0';
		}

		$scope.show = function() {

			$scope.data = {};

			// 一个精心制作的自定义弹窗
			var myPopup = $ionicPopup.show({
				template: '<input style="text-indent: 12px;" type="tel" ng-model="data.his">',
				title: '请输入你要记录的数值',
				subTitle: '保存将上传到云端',
				scope: $scope,
				buttons: [{
					text: '取消',

				}, {
					text: '<b>保存</b>',
					type: 'button-positive',
					onTap: function(e) {

						if(!$scope.data.his) {
							//don't allow the user to close unless he enters wifi password
							$cordovaToast.showShortBottom('请输入要纪录数值').then(function(success) {
								// success
							}, function(error) {
								// error
							});
							e.preventDefault();
						} else {

							$scope.Resuly = $scope.data.his;

						}
					}
				}, ]
			});
			myPopup.then(function(res) {
				//console.log('Tapped!', res);
			});

		}

		//初始化蓝牙
		$scope.ble_initialize = function() {
			bluetoothle.initialize(function(status) {
				if(status["status"] == "enabled") {

					$scope.ble_startScan();

				} else {
					$cordovaToast.showShortBottom('未开启蓝牙').then(function(success) {
						// success
					}, function(error) {
						// error
					});
				}
			}, {
				"request": true,
				"statusReceiver": false,
				"restoreKey": "bluetoothleplugin"
			});
		};

		//
		$scope.ble_hasPermission = function() {
			bluetoothle.hasPermission(function(status) {
				if(status["hasPermission"] == false) {

					$scope.ble_requestPermission();
				} else {
					$scope.ble_isInitialized();

				}
			});
		}

		$scope.ble_requestPermission = function() {
			bluetoothle.requestPermission(function(status) {

				if(status["requestPermission"] == true) {
					//alert("requestPermission ok");
					$scope.ble_isInitialized();
				} else {

					$cordovaToast.showShortBottom('权限不足，蓝牙功能受限').then(function(success) {
						// success
					}, function(error) {
						// error
					});
				}

			}, function() {
				//alert("requestPermission no");
			});
		}

		//扫描蓝牙设备
		$scope.ble_startScan = function() {

			bluetoothle.startScan(function(status) {
				//alert(JSON.stringify(status));
				if(status["status"] == "scanResult") {

					if(status["name"] == "Tem BH" || status["name"] == "Q9") {
						var address = status["address"];
						bluetoothle.stopScan(function(status) {
							//alert(JSON.stringify(status));

							$scope.ble_connect(address);

						}, function(status) {
							//alert("停止扫描报错");
						});

					}
				}

			}, function(status) {
				$cordovaToast.showShortBottom('扫描失败').then(function(success) {
					// success
				}, function(error) {
					// error
				});
			}, {
				"services": [],
				"allowDuplicates": true,
				"scanMode": bluetoothle.SCAN_MODE_LOW_LATENCY,
				"matchMode": bluetoothle.MATCH_MODE_AGGRESSIVE,
				"matchNum": bluetoothle.MATCH_NUM_MAX_ADVERTISEMENT,
				"callbackType": bluetoothle.CALLBACK_TYPE_ALL_MATCHES
			});
		};

		//
		$scope.ble_connect = function(address) {
			bluetoothle.connect(function(status) {
				//alert("连接成功");

				if(status["status"] == "connected") {

					$scope.$apply(function() {
						$scope.isConnect = "连接成功";
						$scope.ble_discover(address);
						$scope.address = address;
					});
				} else if(status["status"] == "disconnected") {

					bluetoothle.close(function(status) {
						//alert(JSON.stringify(status));
						if(status["status"] == "closed") {
							$scope.$apply(function() {
								$scope.isConnect = "扫描蓝牙设备...";
								$scope.ble_startScan();
							});
						}
					}, function(status) {
						//alert("close：" + JSON.stringify(status));
					}, {
						"address": address
					});

				}

			}, function(status) {
				//alert("连接失败" + JSON.stringify(status));
				$cordovaToast.showShortBottom('连接失败').then(function(success) {
					// success
				}, function(error) {
					// error
				});
			}, {
				"address": address
			});
		}

		//
		$scope.ble_discover = function(address) {
			bluetoothle.discover(function(status) {
				//alert("ble_discover" + JSON.stringify(status));
				setTimeout(function() {
					$scope.ble_subscribe(address);
				}, 250);

			}, function(status) {
				alert("ble_discover" + JSON.stringify(status));
			}, {
				"address": address
			});
		}

		//
		$scope.ble_subscribe = function(address) {
			bluetoothle.subscribe(function(status) {
				if(status["status"] == "subscribedResult") {
					//alert(JSON.stringify(status));
					$scope.decoding(status["value"]);
				}
			}, function(status) {
				//alert("subscribe：" + JSON.stringify(status));
			}, {
				"address": address,
				"service": $scope.service,
				"characteristic": $scope.characteristic,
			});
		}

		//
		$scope.ble_isInitialized = function() {
			bluetoothle.isInitialized(function(status) {

				//alert(status);
				if(status["isInitialized"]) {
					//alert("蓝牙已初始化");
					$scope.ble_startScan();
				} else {
					//alert("蓝牙未初始化");
					$scope.ble_initialize();
				}

			});
		}

		$scope.load = function() {

			//系统判断，执行相应的函数
			if($rootScope.systemName == 1) {
				//ios
				$scope.ble_isInitialized();

			} else {
				//android
				$scope.ble_hasPermission();
			}

		};

		$scope.decoding = function(value) {

			var bases64 = bases.fromBase(value, '64'),
				bases16 = bases.toBase(bases64, 16),

				type = bases16.substr(2, 2) + '',
				num = bases16.substr(0, 2) + '';

			switch(type) {
				case "00":
					var str = bases.fromBase(num, '16'),
						Result = (parseInt(bases.toBase(str, 10))) / 10;

					$scope.$apply(function() {
						$scope.Resuly = Result;
					});
					break;
				case "10":
					var first = num.substr(0, 1),
						result = num.substr(1, 1) + first,
						str = bases.fromBase(result, '16'),
						Result = (parseInt(bases.toBase(str, 10)) + 256) / 10;

					$scope.$apply(function() {
						$scope.Resuly = Result;
					});
					break;
				default:
					var n = type.substr(1, 1);
					if(n > 0) {
						var str = bases.fromBase(num, '16'),
							Result = (parseInt(bases.toBase(str, 10)) + (256 * n)) / 10;

						$scope.$apply(function() {
							$scope.Resuly = Result;
						});
					}
			}

		}

		//控制器消除事件
		$scope.$on('$destroy', function() {
			//alert("$destroy");
			bluetoothle.stopScan(function(status) {}, function(status) {});
			if($scope.address) {
				bluetoothle.close(function(status) {}, function(status) {}, {
					"address": $scope.address
				});
			}
		});

		//页面进入完成时触发事件
		//$scope.address = false;
		$scope.load();

	});