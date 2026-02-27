/* eslint-disable react-native/no-inline-styles */
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { View, ScrollView, Linking, Alert } from 'react-native';
import { Card, Text, Button, useTheme, Portal, Dialog, Snackbar, ProgressBar } from 'react-native-paper';
import ApiService from '../../api/OLAPI';
import DeviceInfo from 'react-native-device-info';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

const API_BASE_URL = 'http://47.113.189.138/';

export interface UpdateCardRef {
    checkUpdate: () => void;
    checking: boolean;
}

const UpdateCard = forwardRef<UpdateCardRef>((_, ref) => {
    const theme = useTheme();

    const [currentVersion, setCurrentVersion] = useState(0);
    const [currentVersionName, setCurrentVersionName] = useState('1.0 Preview');
    const [updateInfo, setUpdateInfo] = useState({
        version: 1,
        version_name: '1.0 Preview',
        updates: '暂无更新',
        download: '暂无更新',
    });

    const [dialogVisible, setDialogVisible] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [checking, setChecking] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [apkSize, setApkSize] = useState(0);

    useEffect(() => {
        setCurrentVersion(Number(DeviceInfo.getBuildNumber()));
        const versionName = DeviceInfo.getVersion();
        // 确保版本名完整显示，不截断
        setCurrentVersionName(versionName || '1.0 Preview');
        checkUpdate();
    }, []);

    useImperativeHandle(ref, () => ({
        checkUpdate,
        checking,
    }), [checking]);

    const checkUpdate = async () => {
        setChecking(true);
        ApiService.getUpdataInfo().then(async (res: any) => {
            setUpdateInfo(res);
            const currentBuild = Number(DeviceInfo.getBuildNumber());
            console.log(currentBuild, res);

            if (res.version > currentBuild) {
                const relativePath = res.download.replace(API_BASE_URL, '');
                const fileSize = await ApiService.getFileSize(relativePath);
                setApkSize(fileSize);
                setDialogVisible(true);
            } else {
                setSnackbarVisible(true);
            }
        }).catch(() => {
            setSnackbarVisible(true);
        }).finally(() => {
            setChecking(false);
        });
    };

    const downloadAPK = async () => {
        try {
            setDownloading(true);
            setDownloadProgress(0);

            const downloadUrl = updateInfo.download;
            const fileName = downloadUrl.substring(downloadUrl.lastIndexOf('/') + 1);
            const savePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

            const download = RNFS.downloadFile({
                fromUrl: downloadUrl,
                toFile: savePath,
                progress: (res) => {
                    if (apkSize > 0) {
                        setDownloadProgress(res.bytesWritten / apkSize);
                    }
                },
                progressDivider: 1,
            });

            const result = await download.promise;

            if (result.statusCode === 200) {
                setDownloading(false);
                setDownloadProgress(0);
                setDialogVisible(false);

                try {
                    await Share.open({
                        url: `file://${savePath}`,
                        type: 'application/vnd.android.package-archive',
                        showAppsToView: true,
                    });
                    Alert.alert('下载成功', '正在启动安装...');
                } catch (e) {
                    console.error('Open APK error:', e);
                    try {
                        await Linking.openURL(`file://${savePath}`);
                        Alert.alert('下载成功', '正在启动安装...');
                    } catch (e2) {
                        console.error('Open APK with file:// error:', e2);
                        Alert.alert('下载成功', `文件已保存到: ${savePath}\n请手动打开安装`);
                    }
                }
            } else {
                setDownloading(false);
                setDownloadProgress(0);
                Alert.alert('下载失败', `状态码: ${result.statusCode}`);
            }
        } catch (error) {
            console.error('Download error:', error);
            setDownloading(false);
            setDownloadProgress(0);
            Alert.alert('下载错误', String(error));
        }
    };

    return (
        <>
            {/* Update Available Dialog */}
            <Portal>
                <Dialog
                    visible={dialogVisible}
                    onDismiss={() => setDialogVisible(false)}
                    style={{ borderRadius: 28, backgroundColor: theme.colors.surface }}
                >
                    <Dialog.Icon icon="cellphone-arrow-down" size={32} />
                    <Dialog.Title style={{ textAlign: 'center', fontWeight: '600' }}>
                        发现新版本
                    </Dialog.Title>
                    <Dialog.Content>
                        <View
                            style={{
                                alignSelf: 'center',
                                paddingHorizontal: 16,
                                paddingVertical: 6,
                                borderRadius: 50,
                                marginBottom: 16,
                                backgroundColor: theme.colors.surfaceVariant,
                            }}
                        >
                            <Text
                                variant="labelMedium"
                                style={{
                                    color: theme.colors.onSurfaceVariant,
                                    fontWeight: '600',
                                }}
                            >
                                {currentVersionName} (Build {currentVersion})
                            </Text>
                        </View>
                        <View style={{ alignItems: 'center', marginBottom: 16 }}>
                            <MaterialCommunityIcons
                                name="arrow-down"
                                size={24}
                                color={theme.colors.primary}
                            />
                        </View>
                        <View
                            style={{
                                alignSelf: 'center',
                                paddingHorizontal: 16,
                                paddingVertical: 6,
                                borderRadius: 50,
                                marginBottom: 16,
                                backgroundColor: theme.colors.primaryContainer,
                            }}
                        >
                            <Text
                                variant="labelLarge"
                                style={{
                                    color: theme.colors.onPrimaryContainer,
                                    fontWeight: '600',
                                }}
                            >
                                {updateInfo.version_name} (Build {updateInfo.version})
                            </Text>
                        </View>
                        <Text
                            variant="titleSmall"
                            style={{
                                fontWeight: '600',
                                marginBottom: 8,
                                color: theme.colors.onSurface,
                            }}
                        >
                            更新内容
                        </Text>
                        <Text
                            variant="bodySmall"
                            style={{
                                color: theme.colors.outline,
                                marginBottom: 8,
                            }}
                        >
                            APK大小:{' '}
                            {apkSize > 0
                                ? `${(apkSize / 1024 / 1024).toFixed(2)} MB`
                                : '获取中...'}
                        </Text>
                        <View
                            style={{
                                borderRadius: 16,
                                padding: 16,
                                backgroundColor: theme.colors.surfaceVariant,
                                maxHeight: 200,
                            }}
                        >
                            <ScrollView
                                nestedScrollEnabled
                                showsVerticalScrollIndicator={false}
                            >
                                <Text
                                    variant="bodyMedium"
                                    style={{
                                        color: theme.colors.onSurfaceVariant,
                                        lineHeight: 22,
                                    }}
                                >
                                    {updateInfo.updates}
                                </Text>
                            </ScrollView>
                        </View>
                        {downloading && (
                            <View style={{ marginTop: 16 }}>
                                <Text
                                    variant="bodySmall"
                                    style={{ color: theme.colors.outline, marginBottom: 8 }}
                                >
                                    下载进度
                                </Text>
                                <ProgressBar progress={downloadProgress} />
                                <Text
                                    variant="bodySmall"
                                    style={{
                                        color: theme.colors.outline,
                                        marginTop: 4,
                                        textAlign: 'center',
                                    }}
                                >
                                    {Math.round(downloadProgress * 100)}%
                                </Text>
                            </View>
                        )}
                    </Dialog.Content>
                    <Dialog.Actions
                        style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}
                    >
                        <Button
                            onPress={() => setDialogVisible(false)}
                            textColor={theme.colors.onSurfaceVariant}
                            style={{ borderRadius: 50 }}
                        >
                            取消
                        </Button>
                        <Button
                            mode="contained"
                            onPress={downloadAPK}
                            icon="download"
                            style={{ borderRadius: 50 }}
                            loading={downloading}
                            disabled={downloading}
                        >
                            {downloading ? '下载中...' : '立即更新'}
                        </Button>
                    </Dialog.Actions>
                </Dialog>
                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={2500}
                    style={{
                        borderRadius: 16,
                        position: 'absolute',
                        bottom: 50,
                        marginLeft: '10%',
                        marginRight: '10%',
                    }}
                    action={{ label: '好的', onPress: () => setSnackbarVisible(false) }}
                >
                    当前已是最新版本
                </Snackbar>
            </Portal>
        </>
    );
});

export default UpdateCard;
